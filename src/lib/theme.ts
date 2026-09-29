/**
 * 테마(다크/라이트) 관리. 기본은 다크.
 * html 요소에 'light' 클래스를 붙이면 라이트(화이트) 모드가 됩니다(index.css 토큰 참고).
 * 최초 적용은 index.html 의 인라인 스크립트가 담당(플래시 방지).
 */
export type Theme = 'dark' | 'light'

const KEY = 'mh-theme'

export function getStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'light' || v === 'dark') return v
  } catch {
    /* 무시 */
  }
  return 'dark'
}

export function applyTheme(theme: Theme) {
  const el = document.documentElement
  if (theme === 'light') el.classList.add('light')
  else el.classList.remove('light')
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* 무시 */
  }
  applyTheme(theme)
}
