import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ADMIN_BOOKINGS } from '@/mocks/admin'
import { ADMIN_INQUIRIES } from '@/mocks/data'
import { formatDate, formatPrice, formatTime, toDateKey } from '@/lib/utils'
import { Badge } from '@/components/ui/primitives'
import { AdminPageHeader, DemoNotice } from './AdminLayout'
import { STATUS_TONE } from './statusTone'

export default function AdminDashboardPage() {
  const { t } = useTranslation()
  const today = toDateKey(new Date())

  const todayBookings = ADMIN_BOOKINGS.filter((b) => b.startAt.startsWith(today))
  const pending = ADMIN_BOOKINGS.filter((b) => b.status === 'REQUESTED')
  const newInquiries = ADMIN_INQUIRIES.filter((i) => i.status === 'PENDING')

  // 이번 달에 잡힌 확정·완료 예약의 상품가 합계. 취소 건은 제외합니다.
  const thisMonth = today.slice(0, 7)
  const monthRevenue = ADMIN_BOOKINGS.filter(
    (b) =>
      b.startAt.startsWith(thisMonth) &&
      (b.status === 'CONFIRMED' || b.status === 'COMPLETED'),
  ).reduce((sum, b) => sum + b.price, 0)

  const stats = [
    { label: t('admin.todayBookings'), value: todayBookings.length, to: '/admin/bookings' },
    { label: t('admin.pendingBookings'), value: pending.length, to: '/admin/bookings' },
    { label: t('admin.newInquiries'), value: newInquiries.length, to: '/admin/inquiries' },
    {
      label: t('admin.monthRevenue'),
      value: formatPrice(monthRevenue, 'ko'),
      to: '/admin/bookings',
    },
  ]

  return (
    <>
      <AdminPageHeader title={t('admin.dashboard')} />
      <DemoNotice />

      {/* 통계 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.to} className="surface surface-hover p-6">
            <div className="text-[11px] uppercase tracking-[0.15em] text-ink-500">{stat.label}</div>
            <div className="mt-3 font-display text-3xl tracking-tightest text-white">
              {stat.value}
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* 최근 예약 */}
        <section className="surface overflow-hidden">
          <header className="flex items-center justify-between border-b border-ink-800 px-6 py-4">
            <h2 className="text-sm font-bold text-white">{t('admin.recentBookings')}</h2>
            <Link to="/admin/bookings" className="text-xs text-brand-400 hover:underline">
              {t('common.more')} →
            </Link>
          </header>
          <ul className="divide-y divide-ink-800">
            {ADMIN_BOOKINGS.slice(0, 5).map((b) => (
              <li key={b.id} className="flex items-center gap-4 px-6 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-white">{b.name}</span>
                    {b.locale === 'ja' && <Badge tone="neutral">JA</Badge>}
                  </div>
                  <p className="mt-1 truncate text-xs text-ink-500">
                    {b.productName} · {formatDate(b.startAt, 'ko')} {formatTime(b.startAt)}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[b.status]}>{t(`admin.status${cap(b.status)}`)}</Badge>
              </li>
            ))}
          </ul>
        </section>

        {/* 최근 문의 */}
        <section className="surface overflow-hidden">
          <header className="flex items-center justify-between border-b border-ink-800 px-6 py-4">
            <h2 className="text-sm font-bold text-white">{t('admin.recentInquiries')}</h2>
            <Link to="/admin/inquiries" className="text-xs text-brand-400 hover:underline">
              {t('common.more')} →
            </Link>
          </header>
          <ul className="divide-y divide-ink-800">
            {ADMIN_INQUIRIES.slice(0, 5).map((i) => (
              <li key={i.id} className="flex items-center gap-4 px-6 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-white">{i.name}</span>
                    <Badge tone={i.type === 'INTERPRETER' ? 'brand' : 'neutral'}>
                      {i.type === 'INTERPRETER'
                        ? t('interpreter.typeInterpreter')
                        : t('interpreter.typeVideo')}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-xs text-ink-500">{i.content}</p>
                </div>
                <Badge tone={i.status === 'PENDING' ? 'warning' : 'success'}>
                  {i.status === 'PENDING' ? t('admin.inquiryPending') : t('admin.inquiryHandled')}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}

function cap(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase()
}
