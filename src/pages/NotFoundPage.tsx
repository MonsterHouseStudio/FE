import { useTranslation } from 'react-i18next'
import { useLocalePath } from '@/hooks/useLocale'
import { ButtonLink } from '@/components/ui/Button'
import LogoMark from '@/components/layout/Logo'

export default function NotFoundPage() {
  const { t } = useTranslation()
  const lp = useLocalePath()

  return (
    <div className="container-mh flex min-h-[70vh] flex-col items-center justify-center gap-7 py-24 text-center">
      <LogoMark className="h-14 w-14 text-brand-800" />
      <p className="font-display text-6xl tracking-tightest text-brand-700 sm:text-8xl">404</p>
      <h1 className="heading-md text-white">{t('notFound.title')}</h1>
      <p className="max-w-sm text-sm text-ink-400">{t('notFound.desc')}</p>
      <ButtonLink to={lp('/')} size="lg">
        {t('notFound.cta')}
      </ButtonLink>
    </div>
  )
}
