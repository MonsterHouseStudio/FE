import { create } from 'zustand'

/**
 * 데모용 관리자 세션.
 * 실제 연동 시 이 스토어의 token 을 JWT 액세스 토큰으로 바꾸고,
 * 리프레시는 httpOnly 쿠키로 관리합니다 (기획서 §9).
 */
interface AdminAuthState {
  token: string | null
  username: string | null
  login: (username: string) => void
  logout: () => void
}

const STORAGE_KEY = 'mh_admin_demo'

export const useAdminAuth = create<AdminAuthState>((set) => ({
  token: sessionStorage.getItem(STORAGE_KEY),
  username: sessionStorage.getItem(STORAGE_KEY + '_user'),

  login: (username) => {
    const token = 'demo-token'
    sessionStorage.setItem(STORAGE_KEY, token)
    sessionStorage.setItem(STORAGE_KEY + '_user', username)
    set({ token, username })
  },

  logout: () => {
    sessionStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY + '_user')
    set({ token: null, username: null })
  },
}))
