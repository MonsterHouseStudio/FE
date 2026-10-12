import { create } from 'zustand'

/**
 * 고객 회원 세션 (이메일 + 비밀번호).
 * 관리자와 달리 리프레시 토큰 없이 7일짜리 액세스 토큰 하나를 localStorage 에 보관합니다.
 * (고객 로그인 MVP — 간단함 우선)
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const STORAGE_KEY = 'mh_member_session'

export interface MemberInfo {
  id: number
  email: string
  name: string
  phone: string
}

interface StoredSession {
  token: string
  member: MemberInfo
}

interface MemberAuthState {
  token: string | null
  member: MemberInfo | null
  ready: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (payload: {
    email: string
    password: string
    name: string
    phone: string
  }) => Promise<void>
  logout: () => void
}

function readStored(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredSession) : null
  } catch {
    return null
  }
}

function writeStored(s: StoredSession) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    /* 무시 */
  }
}

async function authRequest(path: string, body: unknown): Promise<StoredSession> {
  const res = await fetch(`${BASE_URL}/members${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) {
    throw new Error(json?.error?.message ?? '요청에 실패했습니다.')
  }
  const data = json.data as { accessToken: string; member: MemberInfo }
  return { token: data.accessToken, member: data.member }
}

const stored = readStored()

export const useMemberAuth = create<MemberAuthState>((set) => ({
  token: stored?.token ?? null,
  member: stored?.member ?? null,
  ready: true,

  login: async (email, password) => {
    const session = await authRequest('/login', { email, password })
    writeStored(session)
    set({ token: session.token, member: session.member })
  },

  signup: async (payload) => {
    const session = await authRequest('/signup', payload)
    writeStored(session)
    set({ token: session.token, member: session.member })
  },

  logout: () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* 무시 */
    }
    set({ token: null, member: null })
  },
}))

export function currentMemberToken(): string | null {
  return useMemberAuth.getState().token
}
