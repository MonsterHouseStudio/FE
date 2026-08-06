import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ko from './locales/ko.json'
import ja from './locales/ja.json'

export const SUPPORTED_LOCALES = ['ko', 'ja'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'ko'
export const LOCALE_COOKIE = 'mh_locale'

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

/**
 * 언어 판별 순서 (기획서 §2.1)
 *   1) 사용자가 이전에 고른 값 (쿠키) — 사용자 선택을 존중
 *   2) 브라우저 언어
 *   3) 기본값 ko
 */
export function detectLocale(): Locale {
  const fromCookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${LOCALE_COOKIE}=`))
    ?.split('=')[1]

  if (isLocale(fromCookie)) return fromCookie

  const fromBrowser = navigator.language?.split('-')[0]
  if (isLocale(fromBrowser)) return fromBrowser

  return DEFAULT_LOCALE
}

export function persistLocale(locale: Locale) {
  // 1년 유지
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`
}

void i18n.use(initReactI18next).init({
  resources: {
    ko: { translation: ko },
    ja: { translation: ja },
  },
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  interpolation: { escapeValue: false },
  returnNull: false,
})

export default i18n
