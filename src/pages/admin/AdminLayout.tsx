import { useEffect } from 'react'
import { Link, NavLink, Navigate, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAdminAuth } from '@/store/adminAuth'
import { detectLocale } from '@/i18n'
import { cn } from '@/lib/utils'
import LogoMark from '@/components/layout/Logo'

const MENU = [
  { key: 'dashboard', path: '/admin', end: true, icon: '▤' },
  { key: 'products', path: '/admin/products', end: false, icon: '◎' },
  { key: 'bookings', path: '/admin/bookings', end: false, icon: '▦' },
  { key: 'calendar', path: '/admin/calendar', end: false, icon: '▣' },
  { key: 'schedule', path: '/admin/schedule', end: false, icon: '◇' },
  { key: 'gallery', path: '/admin/gallery', end: false, icon: '▨' },
  { key: 'posts', path: '/admin/posts', end: false, icon: '✎' },
  { key: 'inquiries', path: '/admin/inquiries', end: false, icon: '✉' },
  { key: 'users', path: '/admin/users', end: false, icon: '⚿' },
] as const

export default function AdminLayout() {
  const { t } = useTranslation()
  const { token, username, displayName, role, ready, restore, logout } = useAdminAuth()

  // 탭을 닫았다 열면 sessionStorage 는 비어 있지만 리프레시 쿠키는 살아 있습니다.
  // 그 경우를 조용히 복구합니다. 끝나기 전에 판단하면 멀쩡한 세션을 로그아웃시킵니다.
  useEffect(() => {
    if (!ready) void restore()
  }, [ready, restore])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 text-sm text-ink-500">
        불러오는 중…
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <div className="flex min-h-screen bg-ink-950">
      {/* 사이드바 */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-ink-800 bg-ink-900 lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-ink-800 px-6 text-brand-500">
          <LogoMark className="h-6 w-6" />
          <span className="font-display text-sm tracking-tightest text-white">
            MH ADMIN
          </span>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {MENU.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-ink-400 hover:bg-ink-800 hover:text-white',
                )
              }
            >
              <span className="text-xs opacity-70">{item.icon}</span>
              {t(`admin.${item.key}`)}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ink-800 p-4">
          <div className="px-2 pb-3 text-xs text-ink-500">
            {displayName ?? username}
            {role === 'SUPER_ADMIN' && (
              <span className="ml-1.5 rounded bg-brand-600/20 px-1.5 py-0.5 text-[10px] font-semibold text-brand-400">
                SUPER
              </span>
            )}
          </div>
          <Link
            to={`/${detectLocale()}`}
            className="block rounded-lg px-4 py-2 text-xs font-semibold text-ink-400 hover:bg-ink-800 hover:text-white"
          >
            ← {t('admin.backToSite')}
          </Link>
          <button
            type="button"
            onClick={logout}
            className="mt-1 block w-full rounded-lg px-4 py-2 text-left text-xs font-semibold text-ink-400 hover:bg-ink-800 hover:text-white"
          >
            {t('admin.logout')}
          </button>
        </div>
      </aside>

      {/* 본문 */}
      <div className="min-w-0 flex-1">
        {/* 모바일 상단바 */}
        <div className="flex items-center justify-between border-b border-ink-800 bg-ink-900 px-5 py-4 lg:hidden">
          <div className="flex items-center gap-2 text-brand-500">
            <LogoMark className="h-5 w-5" />
            <span className="font-display text-sm text-white">MH ADMIN</span>
          </div>
          <button onClick={logout} className="text-xs text-ink-400">
            {t('admin.logout')}
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-b border-ink-800 bg-ink-900 px-3 py-2 lg:hidden">
          {MENU.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold',
                  isActive ? 'bg-brand-600 text-white' : 'text-ink-400',
                )
              }
            >
              {t(`admin.${item.key}`)}
            </NavLink>
          ))}
        </nav>

        <div className="p-5 sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

/** 관리자 화면 공통 헤더 */
export function AdminPageHeader({
  title,
  desc,
  action,
}: {
  title: string
  desc?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl tracking-tightest text-white">{title}</h1>
        {desc && <p className="mt-2 text-sm text-ink-400">{desc}</p>}
      </div>
      {action}
    </div>
  )
}

