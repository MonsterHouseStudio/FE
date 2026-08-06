import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLocalePath } from '@/hooks/useLocale'
import LogoMark from './Logo'

const MENU = [
  { key: 'shooting', path: '/shooting' },
  { key: 'booking', path: '/shooting/booking' },
  { key: 'schedule', path: '/schedule' },
  { key: 'gallery', path: '/gallery' },
  { key: 'media', path: '/media' },
  { key: 'about', path: '/about' },
  { key: 'interpreter', path: '/interpreter' },
] as const

const YOUTUBE = import.meta.env.VITE_YOUTUBE_CHANNEL_URL ?? 'https://www.youtube.com'
const LINE = import.meta.env.VITE_LINE_ADD_FRIEND_URL ?? 'https://line.me'

export default function Footer() {
  const { t } = useTranslation()
  const lp = useLocalePath()

  return (
    <footer className="border-t border-ink-800 bg-ink-950">
      {/* 마퀴 */}
      <div className="overflow-hidden border-b border-ink-800 py-5">
        <div className="flex w-max animate-marquee gap-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="font-display text-2xl tracking-tightest text-ink-800 sm:text-4xl"
            >
              MONSTER HOUSE · 몬스터하우스 · モンスターハウス ·
            </span>
          ))}
        </div>
      </div>

      <div className="container-mh grid gap-12 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5 text-brand-500">
            <LogoMark className="h-8 w-8" />
            <span className="font-display text-lg tracking-tightest text-white">
              MONSTER HOUSE
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-400">{t('footer.desc')}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <a
              href={YOUTUBE}
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-full border border-ink-700 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-ink-300 transition-colors hover:border-brand-500 hover:text-white"
            >
              {t('footer.youtube')}
            </a>
            <a
              href={LINE}
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-full border border-ink-700 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-ink-300 transition-colors hover:border-brand-500 hover:text-white"
            >
              {t('footer.line')}
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-full border border-ink-700 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-ink-300 transition-colors hover:border-brand-500 hover:text-white"
            >
              {t('footer.instagram')}
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-ink-500">
            {t('footer.menu')}
          </h3>
          <ul className="mt-5 space-y-3">
            {MENU.map((item) => (
              <li key={item.key}>
                <Link
                  to={lp(item.path)}
                  className="text-sm text-ink-300 transition-colors hover:text-brand-400"
                >
                  {t(`nav.${item.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-ink-500">
            {t('footer.contact')}
          </h3>
          <ul className="mt-5 space-y-3 text-sm text-ink-300">
            <li>
              <span className="block text-[11px] uppercase tracking-wider text-ink-600">
                {t('footer.email')}
              </span>
              contact@monsterhouse.example
            </li>
            <li>
              <span className="block text-[11px] uppercase tracking-wider text-ink-600">
                {t('about.hours')}
              </span>
              {t('about.hoursValue')}
            </li>
            <li className="pt-2">
              <Link to={lp('/privacy')} className="text-ink-400 underline-offset-4 hover:text-brand-400 hover:underline">
                {t('footer.privacy')}
              </Link>
            </li>
            <li>
              <Link to="/admin" className="text-ink-600 underline-offset-4 hover:text-ink-300 hover:underline">
                {t('nav.admin')}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-800">
        <div className="container-mh flex flex-col gap-2 py-6 text-[11px] uppercase tracking-wider text-ink-600 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} MONSTER HOUSE. {t('footer.rights')}</span>
          <span>Seoul · Tokyo</span>
        </div>
      </div>
    </footer>
  )
}
