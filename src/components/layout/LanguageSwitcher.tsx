import { useLocation, useNavigate } from 'react-router-dom'
import { SUPPORTED_LOCALES, persistLocale, type Locale } from '@/i18n'
import { useLocale } from '@/hooks/useLocale'
import { cn } from '@/lib/utils'

const LABELS: Record<Locale, string> = { ko: 'KO', ja: 'JA' }

/**
 * 언어를 바꿔도 보고 있던 페이지에 그대로 머무릅니다.
 * /ko/shooting → /ja/shooting
 */
export default function LanguageSwitcher({ className }: { className?: string }) {
  const current = useLocale()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()

  const switchTo = (next: Locale) => {
    if (next === current) return
    persistLocale(next)
    const rest = pathname.replace(/^\/[^/]+/, '')
    navigate(`/${next}${rest}${search}`, { replace: true })
  }

  return (
    <div className={cn('flex items-center rounded-full border border-ink-700 p-0.5', className)}>
      {SUPPORTED_LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => switchTo(locale)}
          aria-current={locale === current}
          className={cn(
            'rounded-full px-3 py-1 text-[11px] font-bold tracking-widest transition-colors',
            locale === current
              ? 'bg-brand-600 text-white'
              : 'text-ink-400 hover:text-white',
          )}
        >
          {LABELS[locale]}
        </button>
      ))}
    </div>
  )
}
