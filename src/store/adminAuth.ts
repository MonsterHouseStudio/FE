import { create } from 'zustand'

/**
 * 관리자 세션 (기획서 §9).
 *
 * 토큰을 두 종류로 나눈 이유:
 *   · 액세스 토큰 — 짧은 수명(30분). JS 가 읽어 Authorization 헤더에 실습니다.
 *   · 리프레시 토큰 — httpOnly 쿠키. JS 가 아예 못 읽습니다.
 *
 * 그래서 XSS 가 나도 훔칠 수 있는 건 30분짜리 액세스 토큰뿐이고,
 * 재발급 능력(리프레시)까지는 넘어가지 않습니다.
 * 쿠키 path 가 /api/admin/auth 라 다른 API 요청에는 실려 가지도 않습니다.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const STORAGE_KEY = 'mh_admin_session'

export type AdminRole = 'SUPER_ADMIN' | 'MANAGER'

interface TokenResponse {
  accessToken: string
  expiresInSeconds: number
  username: string
  displayName: string
  role: AdminRole
}

interface StoredSession {
  token: string
  username: string
  displayName: string
  role: AdminRole
}

interface AdminAuthState {
  token: string | null
  username: string | null
  displayName: string | null
  role: AdminRole | null
  /** 최초 복구 시도가 끝났는가. 이게 false 인 동안 라우터는 판단을 미룹니다. */
  ready: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  restore: () => Promise<void>
}

function readStored(): StoredSession | null {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredSession
  } catch {
    sessionStorage.removeItem(STORAGE_KEY)
    return null
  }
}

function writeStored(session: StoredSession) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

/** 서버 응답 봉투를 벗기고 실패면 던집니다. */
async function authRequest(path: string, init?: RequestInit): Promise<TokenResponse> {
  const res = await fetch(`${BASE_URL}/admin/auth${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // ★ 리프레시 쿠키를 주고받으려면 반드시 필요합니다.
    //   빠뜨리면 로그인은 되는데 새로고침 때마다 로그아웃됩니다.
    credentials: 'include',
    ...init,
  })

  const json = await res.json().catch(() => null)

  if (!res.ok || !json?.success) {
    throw new Error(json?.error?.message ?? '요청에 실패했습니다.')
  }
  return json.data as TokenResponse
}

const stored = readStored()

export const useAdminAuth = create<AdminAuthState>((set) => ({
  token: stored?.token ?? null,
  username: stored?.username ?? null,
  displayName: stored?.displayName ?? null,
  role: stored?.role ?? null,
  ready: false,

  login: async (username, password) => {
    const data = await authRequest('/login', {
      body: JSON.stringify({ username, password }),
    })
    const session: StoredSession = {
      token: data.accessToken,
      username: data.username,
      displayName: data.displayName,
      role: data.role,
    }
    writeStored(session)
    set({ ...session, ready: true })
  },

  logout: async () => {
    // 서버에서 리프레시 토큰을 폐기해야 진짜 로그아웃입니다.
    // 실패해도 로컬 세션은 지웁니다 — 화면에 남아 있는 게 더 위험합니다.
    try {
      await authRequest('/logout')
    } catch {
      /* 무시 */
    }
    sessionStorage.removeItem(STORAGE_KEY)
    set({ token: null, username: null, displayName: null, role: null, ready: true })
  },

  /**
   * 앱 시작 시 1회. 탭을 닫았다 열면 sessionStorage 가 비어 있지만
   * 리프레시 쿠키는 살아 있으므로 조용히 재발급을 시도합니다.
   */
  restore: async () => {
    if (readStored()) {
      set({ ready: true })
      return
    }
    try {
      const data = await refreshAccessToken()
      if (!data) throw new Error('no session')
      set({ ...data, ready: true })
    } catch {
      set({ token: null, username: null, displayName: null, role: null, ready: true })
    }
  },
}))

// =====================================================================
//  액세스 토큰 재발급
// =====================================================================

/**
 * ★ 동시 요청 대응.
 *
 * 대시보드처럼 여러 API 를 한 번에 쏘는 화면에서 토큰이 만료되면
 * 401 이 동시에 여러 개 터집니다. 각자 재발급을 부르면 리프레시 토큰이
 * 여러 번 회전(rotation)하면서 서버가 "재사용 감지"로 판단해
 * 모든 세션을 끊어버립니다 — 즉 로그아웃됩니다.
 * 진행 중인 재발급이 있으면 그 약속을 같이 기다리게 해서 1회로 묶습니다.
 */
let inflight: Promise<StoredSession | null> | null = null

export function refreshAccessToken(): Promise<StoredSession | null> {
  if (inflight) return inflight

  inflight = authRequest('/refresh')
    .then((data) => {
      const session: StoredSession = {
        token: data.accessToken,
        username: data.username,
        displayName: data.displayName,
        role: data.role,
      }
      writeStored(session)
      useAdminAuth.setState({ ...session })
      return session
    })
    .catch(() => {
      sessionStorage.removeItem(STORAGE_KEY)
      useAdminAuth.setState({ token: null, username: null, displayName: null, role: null })
      return null
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

export function currentAccessToken(): string | null {
  return useAdminAuth.getState().token
}
