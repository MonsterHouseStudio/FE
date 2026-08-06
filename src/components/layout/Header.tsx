import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLocale, useLocalePath } from '@/hooks/useLocale'
import { cn } from '@/lib/utils'
import LogoMark from './Logo'
import LanguageSwitcher from './LanguageSwitcher'

const NAV = [
  { key: 'shooting', path: '/shooting' },
  { key: 'schedule', path: '/schedule' },
  { key: 'gallery', path: '/gallery' },
  { key: 'media', path: '/media' },
  { key: 'about', path: '/about' },
  { key: 'interpreter', path: '/interpreter' },
] as const

export default function Header() {
  const { t } = useTranslation()
  const lp = useLocalePath()
  const locale = useLocale()
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled || open
          ? 'border-b border-ink-800 bg-ink-950/92 backdrop-blur-md'
          : 'border-b border-transparent bg-gradient-to-b from-ink-950/80 to-transparent',
      )}
    >
      <div className="container-mh flex h-16 items-center justify-between gap-6 sm:h-20">
        <Link to={lp('/')} className="flex items-center gap-2.5 text-brand-500">
          <LogoMark className="h-7 w-7 sm:h-8 sm:w-8" />
          <span className="font-display text-base tracking-tightest text-white sm:text-lg">
            MONSTER HOUSE
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.key}
              to={lp(item.path)}
              className={({ isActive }) =>
                cn(
                  'rounded-full px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-colors',
                  isActive ? 'text-white' : 'text-ink-400 hover:text-white',
                )
              }
            >
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher className="hidden sm:flex" />
          <Link
            to={lp('/shooting/booking')}
            className="hidden rounded-full bg-brand-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-brand-500 sm:inline-flex"
          >
            {t('nav.booking')}
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="menu"
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-700 text-ink-200 lg:hidden"
          >
            <span className="relative block h-3 w-4">
              <span
                className={cn(
                  'absolute left-0 h-0.5 w-4 bg-current transition-all',
                  open ? 'top-1.5 rotate-45' : 'top-0',
                )}
              />
              <span
                className={cn(
                  'absolute left-0 top-1.5 h-0.5 w-4 bg-current transition-opacity',
                  open && 'opacity-0',
                )}
              />
              <span
                className={cn(
                  'absolute left-0 h-0.5 w-4 bg-current transition-all',
                  open ? 'top-1.5 -rotate-45' : 'top-3',
                )}
              />
            </span>
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      <div
        className={cn(
          'overflow-hidden border-t border-ink-800 bg-ink-950 transition-[max-height] duration-300 lg:hidden',
          open ? 'max-h-[520px]' : 'max-h-0 border-t-0',
        )}
      >
        <nav className="container-mh flex flex-col py-4">
          {NAV.map((item) => (
            <NavLink
              key={item.key}
              to={lp(item.path)}
              className={({ isActive }) =>
                cn(
                  'border-b border-ink-800/70 py-3.5 text-sm font-bold uppercase tracking-wider',
                  isActive ? 'text-brand-400' : 'text-ink-300',
                )
              }
            >
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
          <div className="flex items-center justify-between gap-4 pt-5">
            <LanguageSwitcher />
            <Link
              to={lp('/shooting/booking')}
              className="flex-1 rounded-full bg-brand-600 px-5 py-3 text-center text-xs font-bold uppercase tracking-wider text-white"
            >
              {t('nav.booking')}
            </Link>
          </div>
          <p className="pt-4 text-[11px] uppercase tracking-[0.2em] text-ink-600">
            {locale === 'ja' ? '日本語対応' : '한국어 / 日本語'}
          </p>
        </nav>
      </div>
    </header>
  )
}
