import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useModalDismiss } from '@/hooks/useModalDismiss'
import { ADMIN_BOOKINGS, type AdminBookingRow } from '@/mocks/admin'
import { cn, formatDate, formatTime } from '@/lib/utils'
import type { BookingStatus } from '@/types'
import { Badge } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { AdminPageHeader, DemoNotice } from './AdminLayout'
import { STATUS_TONE } from './statusTone'

type Filter = 'ALL' | BookingStatus

export default function AdminBookingsPage() {
  const { t } = useTranslation()
  const [rows, setRows] = useState<AdminBookingRow[]>(ADMIN_BOOKINGS)
  const [filter, setFilter] = useState<Filter>('ALL')
  const [detail, setDetail] = useState<AdminBookingRow | null>(null)

  const filtered = useMemo(
    () => rows.filter((r) => (filter === 'ALL' ? true : r.status === filter)),
    [rows, filter],
  )

  const closeDetail = useCallback(() => setDetail(null), [])
  useModalDismiss(!!detail, closeDetail)

  const setStatus = (id: number, status: BookingStatus) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    setDetail(null)
  }

  const filters: { key: Filter; label: string }[] = [
    { key: 'ALL', label: t('common.all') },
    { key: 'REQUESTED', label: t('admin.statusRequested') },
    { key: 'CONFIRMED', label: t('admin.statusConfirmed') },
    { key: 'COMPLETED', label: t('admin.statusCompleted') },
    { key: 'CANCELED', label: t('admin.statusCanceled') },
  ]

  return (
    <>
      <AdminPageHeader title={t('admin.bookings')} />
      <DemoNotice />

      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-xs font-bold transition-colors',
              filter === f.key
                ? 'border-brand-500 bg-brand-600 text-white'
                : 'border-ink-800 text-ink-400 hover:text-white',
            )}
          >
            {f.label}
            <span className="ml-2 text-ink-500">
              {f.key === 'ALL' ? rows.length : rows.filter((r) => r.status === f.key).length}
            </span>
          </button>
        ))}
      </div>

      <div className="surface overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-ink-800 text-[11px] uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-5 py-4 font-semibold">{t('booking.bookingCode')}</th>
              <th className="px-5 py-4 font-semibold">{t('admin.customer')}</th>
              <th className="px-5 py-4 font-semibold">{t('admin.product')}</th>
              <th className="px-5 py-4 font-semibold">{t('admin.datetime')}</th>
              <th className="px-5 py-4 font-semibold">{t('admin.status')}</th>
              <th className="px-5 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {filtered.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-ink-800/40">
                <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-ink-400">
                  {row.bookingCode}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{row.name}</span>
                    {row.locale === 'ja' && <Badge tone="neutral">JA</Badge>}
                  </div>
                  <div className="mt-0.5 text-xs text-ink-500">{row.phone}</div>
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-ink-200">{row.productName}</td>
                <td className="whitespace-nowrap px-5 py-4 text-ink-200">
                  {formatDate(row.startAt, 'ko')}
                  <span className="ml-2 text-ink-400">
                    {formatTime(row.startAt)}–{formatTime(row.endAt)}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <Badge tone={STATUS_TONE[row.status]}>
                    {t(`admin.status${cap(row.status)}`)}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => setDetail(row)}
                    className="text-xs font-bold text-brand-400 hover:underline"
                  >
                    {t('common.more')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 상세 패널 */}
      {detail && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-5"
          onClick={closeDetail}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="surface max-h-[90vh] w-full max-w-lg overflow-y-auto p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-ink-500">{detail.bookingCode}</p>
                <h2 className="mt-2 font-display text-xl tracking-tightest text-white">
                  {detail.name}
                </h2>
              </div>
              <Badge tone={STATUS_TONE[detail.status]}>
                {t(`admin.status${cap(detail.status)}`)}
              </Badge>
            </div>

            <dl className="mt-6 space-y-3 border-t border-ink-800 pt-5 text-sm">
              {[
                { k: t('admin.product'), v: detail.productName },
                {
                  k: t('admin.datetime'),
                  v: `${formatDate(detail.startAt, 'ko')} ${formatTime(detail.startAt)}–${formatTime(detail.endAt)}`,
                },
                { k: t('booking.phone'), v: detail.phone },
                { k: t('booking.email'), v: detail.email },
                { k: t('admin.createdAt'), v: formatDate(detail.createdAt, 'ko') },
              ].map((item) => (
                <div key={item.k} className="flex justify-between gap-6">
                  <dt className="shrink-0 text-ink-500">{item.k}</dt>
                  <dd className="text-right text-ink-100">{item.v}</dd>
                </div>
              ))}
              {detail.memo && (
                <div className="border-t border-ink-800 pt-4">
                  <dt className="text-ink-500">{t('booking.memo')}</dt>
                  <dd className="mt-2 text-ink-200">{detail.memo}</dd>
                </div>
              )}
            </dl>

            <div className="mt-7 flex flex-wrap gap-2 border-t border-ink-800 pt-5">
              {detail.status === 'REQUESTED' && (
                <Button size="sm" onClick={() => setStatus(detail.id, 'CONFIRMED')}>
                  {t('admin.actionConfirm')}
                </Button>
              )}
              {detail.status === 'CONFIRMED' && (
                <Button size="sm" onClick={() => setStatus(detail.id, 'COMPLETED')}>
                  {t('admin.actionComplete')}
                </Button>
              )}
              {(detail.status === 'REQUESTED' || detail.status === 'CONFIRMED') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStatus(detail.id, 'CANCELED')}
                >
                  {t('admin.actionCancel')}
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={closeDetail}>
                {t('common.close')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function cap(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase()
}
