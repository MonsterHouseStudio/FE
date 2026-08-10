import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useModalDismiss } from '@/hooks/useModalDismiss'
import { useAsync } from '@/hooks/useAsync'
import { adminApi } from '@/lib/api'
import { cn, formatDate, formatPrice, formatTime } from '@/lib/utils'
import type { AdminBooking, BookingStatus } from '@/types'
import { Badge } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { AdminPageHeader } from './AdminLayout'
import { AsyncBoundary } from './AsyncBoundary'
import { STATUS_TONE } from './statusTone'

type Filter = 'ALL' | BookingStatus

const PAGE_SIZE = 20

export default function AdminBookingsPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()

  // 대시보드에서 "대기 N건"을 누르면 ?status=REQUESTED 로 들어옵니다.
  const filter = (params.get('status') as Filter) || 'ALL'
  const [keyword, setKeyword] = useState('')
  const [applied, setApplied] = useState('')
  const [page, setPage] = useState(0)
  const [detail, setDetail] = useState<AdminBooking | null>(null)

  const { data, loading, error, reload } = useAsync(
    () =>
      adminApi.getBookings({
        status: filter === 'ALL' ? '' : filter,
        keyword: applied,
        page,
        size: PAGE_SIZE,
      }),
    [filter, applied, page],
  )

  const closeDetail = useCallback(() => setDetail(null), [])
  useModalDismiss(!!detail, closeDetail)

  const changeFilter = (next: Filter) => {
    setPage(0)
    if (next === 'ALL') setParams({})
    else setParams({ status: next })
  }

  /** 상태 변경 후 목록과 상세를 함께 갱신합니다. */
  const afterAction = (updated?: AdminBooking) => {
    reload()
    if (updated) setDetail(updated)
    else setDetail(null)
  }

  const filters: { key: Filter; label: string }[] = [
    { key: 'ALL', label: t('common.all') },
    { key: 'REQUESTED', label: t('admin.statusRequested') },
    { key: 'CONFIRMED', label: t('admin.statusConfirmed') },
    { key: 'COMPLETED', label: t('admin.statusCompleted') },
    { key: 'CANCELED', label: t('admin.statusCanceled') },
  ]

  const rows = data?.content ?? []

  return (
    <>
      <AdminPageHeader
        title={t('admin.bookings')}
        desc={data ? `전체 ${data.totalElements}건` : undefined}
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => changeFilter(f.key)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-xs font-bold transition-colors',
              filter === f.key
                ? 'border-brand-500 bg-brand-600 text-white'
                : 'border-ink-800 text-ink-400 hover:text-white',
            )}
          >
            {f.label}
          </button>
        ))}

        <form
          className="ml-auto flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setPage(0)
            setApplied(keyword.trim())
          }}
        >
          <input
            className="field h-9 w-52 text-xs"
            placeholder="이름 · 연락처 · 예약번호"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Button size="sm" variant="outline" type="submit">
            검색
          </Button>
        </form>
      </div>

      <AsyncBoundary
        loading={loading}
        error={error}
        empty={!loading && rows.length === 0}
        emptyText={applied ? `"${applied}" 검색 결과가 없습니다.` : '조건에 맞는 예약이 없습니다.'}
        onRetry={reload}
      >
        {rows.length > 0 && (
          <>
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
                  {rows.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-ink-800/40">
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-ink-400">
                        {row.bookingCode}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{row.name}</span>
                          {row.locale === 'JA' && <Badge tone="neutral">JA</Badge>}
                        </div>
                        <div className="mt-0.5 text-xs text-ink-500">{row.phone}</div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-ink-200">
                        {row.productName}
                        {row.optionSummary.length > 0 && (
                          <div className="mt-0.5 text-xs text-ink-500">
                            + {row.optionSummary.join(', ')}
                          </div>
                        )}
                      </td>
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

            {data && data.totalPages > 1 && (
              <div className="mt-5 flex items-center justify-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={data.first}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  이전
                </Button>
                <span className="text-xs text-ink-400">
                  {data.page + 1} / {data.totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={data.last}
                  onClick={() => setPage((p) => p + 1)}
                >
                  다음
                </Button>
              </div>
            )}
          </>
        )}
      </AsyncBoundary>

      {detail && (
        <BookingDetailModal
          booking={detail}
          onClose={closeDetail}
          onChanged={afterAction}
        />
      )}
    </>
  )
}

// =====================================================================

function BookingDetailModal({
  booking,
  onClose,
  onChanged,
}: {
  booking: AdminBooking
  onClose: () => void
  onChanged: (updated?: AdminBooking) => void
}) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rescheduling, setRescheduling] = useState(false)
  const [newStartAt, setNewStartAt] = useState(booking.startAt)

  /** 서버 에러 메시지를 그대로 보여줍니다. "이미 예약된 시간입니다" 같은 안내가 이미 다국어로 옵니다. */
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : '처리에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const cancel = () => {
    const reason = window.prompt('취소 사유를 입력하세요 (고객 안내 메일에는 포함되지 않습니다)')
    // prompt 취소를 누르면 null 입니다. 빈 문자열("")은 사유 없이 진행하겠다는 뜻이므로 통과시킵니다.
    if (reason === null) return
    void run(() => adminApi.cancelBooking(booking.id, reason))
  }

  const canAct = booking.status === 'REQUESTED' || booking.status === 'CONFIRMED'

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-5"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="surface max-h-[90vh] w-full max-w-lg overflow-y-auto p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-ink-500">{booking.bookingCode}</p>
            <h2 className="mt-2 font-display text-xl tracking-tightest text-white">
              {booking.name}
            </h2>
          </div>
          <Badge tone={STATUS_TONE[booking.status]}>
            {t(`admin.status${cap(booking.status)}`)}
          </Badge>
        </div>

        <dl className="mt-6 space-y-3 border-t border-ink-800 pt-5 text-sm">
          {[
            { k: t('admin.product'), v: booking.productName },
            {
              k: t('admin.datetime'),
              v: `${formatDate(booking.startAt, 'ko')} ${formatTime(booking.startAt)}–${formatTime(booking.endAt)}`,
            },
            { k: t('booking.phone'), v: booking.phone },
            { k: t('booking.email'), v: booking.email },
            { k: '결제 금액', v: formatPrice(booking.totalPrice, 'ko') },
            { k: t('admin.createdAt'), v: formatDate(booking.createdAt, 'ko') },
          ].map((item) => (
            <div key={item.k} className="flex justify-between gap-6">
              <dt className="shrink-0 text-ink-500">{item.k}</dt>
              <dd className="text-right text-ink-100">{item.v}</dd>
            </div>
          ))}

          {booking.optionSummary.length > 0 && (
            <div className="flex justify-between gap-6">
              <dt className="shrink-0 text-ink-500">추가 옵션</dt>
              <dd className="text-right text-ink-100">{booking.optionSummary.join(', ')}</dd>
            </div>
          )}

          {booking.memo && (
            <div className="border-t border-ink-800 pt-4">
              <dt className="text-ink-500">{t('booking.memo')}</dt>
              <dd className="mt-2 whitespace-pre-wrap text-ink-200">{booking.memo}</dd>
            </div>
          )}
        </dl>

        {/* 시간 변경 */}
        {canAct && rescheduling && (
          <div className="mt-6 rounded-lg border border-ink-700 bg-ink-900/60 p-4">
            <label className="label" htmlFor="newStartAt">
              변경할 시각
            </label>
            <input
              id="newStartAt"
              type="datetime-local"
              className="field"
              // 30분 격자에 맞지 않으면 서버가 거부합니다. 브라우저에서 먼저 걸러줍니다.
              step={1800}
              value={newStartAt}
              onChange={(e) => setNewStartAt(e.target.value)}
            />
            <p className="mt-2 text-[11px] leading-relaxed text-ink-500">
              관리자 변경은 &ldquo;24시간 전까지&rdquo; 제한을 받지 않습니다. 다만 영업시간·휴무일과
              다른 예약과의 중복은 그대로 검사합니다.
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                disabled={busy}
                onClick={() => void run(() => adminApi.rescheduleBooking(booking.id, newStartAt))}
              >
                변경 저장
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRescheduling(false)}>
                {t('common.close')}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs leading-relaxed text-red-300"
          >
            {error}
          </p>
        )}

        <div className="mt-7 flex flex-wrap gap-2 border-t border-ink-800 pt-5">
          {booking.status === 'REQUESTED' && (
            <Button
              size="sm"
              disabled={busy}
              onClick={() => void run(() => adminApi.confirmBooking(booking.id))}
            >
              {t('admin.actionConfirm')}
            </Button>
          )}
          {booking.status === 'CONFIRMED' && (
            <Button
              size="sm"
              disabled={busy}
              onClick={() => void run(() => adminApi.completeBooking(booking.id))}
            >
              {t('admin.actionComplete')}
            </Button>
          )}
          {canAct && !rescheduling && (
            <Button size="sm" variant="outline" onClick={() => setRescheduling(true)}>
              시간 변경
            </Button>
          )}
          {canAct && (
            <Button size="sm" variant="outline" disabled={busy} onClick={cancel}>
              {t('admin.actionCancel')}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      </div>
    </div>
  )
}

function cap(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase()
}
