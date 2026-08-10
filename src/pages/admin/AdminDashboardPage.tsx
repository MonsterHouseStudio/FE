import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { adminApi } from '@/lib/api'
import { useAsync } from '@/hooks/useAsync'
import { formatDate, formatPrice, formatTime } from '@/lib/utils'
import { Badge } from '@/components/ui/primitives'
import { AdminPageHeader } from './AdminLayout'
import { AsyncBoundary } from './AsyncBoundary'
import { STATUS_TONE } from './statusTone'

export default function AdminDashboardPage() {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useAsync(() => adminApi.getDashboard(), [])

  const stats = [
    { label: t('admin.todayBookings'), value: data?.todayBookings ?? 0, to: '/admin/bookings' },
    {
      label: t('admin.pendingBookings'),
      value: data?.pendingBookings ?? 0,
      to: '/admin/bookings?status=REQUESTED',
      // 대기 건은 사장님이 액션해야 하는 항목입니다. 0 이 아니면 눈에 띄게 합니다.
      alert: (data?.pendingBookings ?? 0) > 0,
    },
    {
      label: t('admin.newInquiries'),
      value: data?.pendingInquiries ?? 0,
      to: '/admin/inquiries?status=PENDING',
      alert: (data?.pendingInquiries ?? 0) > 0,
    },
    {
      label: t('admin.monthRevenue'),
      value: formatPrice(data?.monthRevenue ?? 0, 'ko'),
      to: '/admin/bookings',
    },
  ]

  return (
    <>
      <AdminPageHeader title={t('admin.dashboard')} />

      <AsyncBoundary loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <Link key={stat.label} to={stat.to} className="surface surface-hover p-6">
                  <div className="text-[11px] uppercase tracking-[0.15em] text-ink-500">
                    {stat.label}
                  </div>
                  <div
                    className={
                      'mt-3 font-display text-3xl tracking-tightest ' +
                      (stat.alert ? 'text-brand-400' : 'text-white')
                    }
                  >
                    {stat.value}
                  </div>
                </Link>
              ))}
            </div>

            {/* 갤러리 동의 대기 — 기획서 §9. 방치하면 초상권 문제가 됩니다. */}
            {data.galleryAwaitingConsent > 0 && (
              <Link
                to="/admin/gallery"
                className="mt-4 flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-5 py-3.5 text-sm text-amber-200 hover:bg-amber-500/10"
              >
                <span className="font-bold">{data.galleryAwaitingConsent}건</span>
                <span className="text-amber-200/80">
                  의 갤러리 사진이 게시 동의를 기다리고 있습니다. 동의 전에는 공개되지 않습니다.
                </span>
              </Link>
            )}

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <section className="surface overflow-hidden">
                <header className="flex items-center justify-between border-b border-ink-800 px-6 py-4">
                  <h2 className="text-sm font-bold text-white">{t('admin.recentBookings')}</h2>
                  <Link to="/admin/bookings" className="text-xs text-brand-400 hover:underline">
                    {t('common.more')} →
                  </Link>
                </header>
                {data.recentBookings.length === 0 ? (
                  <p className="px-6 py-10 text-center text-sm text-ink-500">아직 예약이 없습니다.</p>
                ) : (
                  <ul className="divide-y divide-ink-800">
                    {data.recentBookings.map((b) => (
                      <li key={b.id} className="flex items-center gap-4 px-6 py-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold text-white">
                              {b.name}
                            </span>
                            {b.locale === 'JA' && <Badge tone="neutral">JA</Badge>}
                          </div>
                          <p className="mt-1 truncate text-xs text-ink-500">
                            {b.productName} · {formatDate(b.startAt, 'ko')} {formatTime(b.startAt)}
                          </p>
                        </div>
                        <Badge tone={STATUS_TONE[b.status]}>
                          {t(`admin.status${cap(b.status)}`)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="surface overflow-hidden">
                <header className="flex items-center justify-between border-b border-ink-800 px-6 py-4">
                  <h2 className="text-sm font-bold text-white">{t('admin.recentInquiries')}</h2>
                  <Link to="/admin/inquiries" className="text-xs text-brand-400 hover:underline">
                    {t('common.more')} →
                  </Link>
                </header>
                {data.recentInquiries.length === 0 ? (
                  <p className="px-6 py-10 text-center text-sm text-ink-500">아직 문의가 없습니다.</p>
                ) : (
                  <ul className="divide-y divide-ink-800">
                    {data.recentInquiries.map((i) => (
                      <li key={i.id} className="flex items-center gap-4 px-6 py-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold text-white">
                              {i.name}
                            </span>
                            <Badge tone={i.type === 'INTERPRETER' ? 'brand' : 'neutral'}>
                              {i.type === 'INTERPRETER'
                                ? t('interpreter.typeInterpreter')
                                : t('interpreter.typeVideo')}
                            </Badge>
                          </div>
                          <p className="mt-1 truncate text-xs text-ink-500">{i.content}</p>
                        </div>
                        <Badge tone={i.status === 'PENDING' ? 'warning' : 'success'}>
                          {i.status === 'PENDING'
                            ? t('admin.inquiryPending')
                            : t('admin.inquiryHandled')}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </AsyncBoundary>
    </>
  )
}

function cap(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase()
}
