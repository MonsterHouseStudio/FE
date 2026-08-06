import { useParams } from 'react-router-dom'
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n'

/** URL 의 /:locale 세그먼트가 이 앱의 단일 진실 공급원입니다. */
export function useLocale(): Locale {
  const { locale } = useParams<{ locale: string }>()
  return isLocale(locale) ? locale : DEFAULT_LOCALE
}

/** 현재 언어를 유지하는 경로를 만듭니다. path 는 '/shooting' 처럼 앞에 슬래시. */
export function useLocalePath() {
  const locale = useLocale()
  return (path: string) => `/${locale}${path === '/' ? '' : path}`
}
