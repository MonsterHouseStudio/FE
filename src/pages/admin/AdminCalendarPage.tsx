import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsync } from '@/hooks/useAsync'
import { adminApi } from '@/lib/api'
import { cn, formatTime, toDateKey } from '@/lib/utils'
import type { AvailabilityOverride, Booking, Weekday } from '@/types'
import { Badge } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { AdminPageHeader } from './AdminLayout'
import { AsyncBoundary } from './AsyncBoundary'
import { OverrideBadge, OverrideModal, WeeklyHoursModal } from './AvailabilityEditor'
import { STATUS_TONE } from './statusTone'

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

/** 화면은 일요일 시작, 백엔드 DayOfWeek 는 월요일 시작이라 매핑이 필요합니다. */
const WEEKDAY_OF: Record<(typeof DAY_KEYS)[number], Weekday> = {
  sun: 'SUNDAY',
  mon: 'MONDAY',
  tue: 'TUESDAY',
  wed: 'WEDNESDAY',
  thu: 'THURSDAY',
  fri: 'FRIDAY',
  sat: 'SATURDAY',
}

export default function AdminCalendarPage() {
  const { t } = useTranslation()
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const from = toDateKey(new Date(year, month, 1))
  const to = toDateKey(new Date(year, month + 1, 0))

  const bookings = useAsync(() => adminApi.getCalendar(from, to), [from, to])
  const availability = useAsync(() => adminApi.getAvailability(), [])
  const overrides = useAsync(() => adminApi.getOverrides(from, to), [from, to])

  const [editingHours, setEditingHours] = useState(false)
  const [editingDate, setEditingDate] = useState<string | null>(null)

  /** 날짜별 예외를 빠르게 찾기 위한 색인 */
  const overrideByDate = useMemo(() => {
    const map = new Map<string, AvailabilityOverride>()
    ;(overrides.data ?? []).forEach((o) => map.set(o.date, o))
    return map
  }, [overrides.data])

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>()
    // 취소 건은 달력에서 뺍니다. 사장님이 봐야 하는 건 "실제로 잡혀 있는 일정"입니다.
    ;(bookings.data ?? [])
      .filter((b) => b.status !== 'CANCELED')
      .forEach((b) => {
        const key = b.startAt.slice(0, 10)
        map.set(key, [...(map.get(key) ?? []), b])
      })
    return map
  }, [bookings.data])

  /** 요일별 휴무 판정 — 하드코딩된 정기휴무 대신 실제 availability 를 씁니다. */
  const closedWeekdays = useMemo(() => {
    const set = new Set<number>()
    ;(availability.data ?? []).forEach((row) => {
      if (row.active) return
      const idx = DAY_KEYS.findIndex((k) => WEEKDAY_OF[k] === row.dayOfWeek)
      if (idx >= 0) set.add(idx)
    })
    return set
  }, [availability.data])

  const cells = useMemo(() => {
    const first = new Date(year, month, 1)
    const last = new Date(year, month + 1, 0)
    const list: (Date | null)[] = Array.from({ length: first.getDay() }, () => null)
    for (let d = 1; d <= last.getDate(); d++) list.push(new Date(year, month, d))
    return list
  }, [year, month])

  const move = (delta: number) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1))

  const monthBookings = bookings.data ?? []

  return (
    <>
      <AdminPageHeader
        title={t('admin.calendar')}
        desc={`이 달 예약 ${monthBookings.filter((b) => b.status !== 'CANCELED').length}건 · 날짜를 누르면 휴무·특별영업을 지정할 수 있습니다`}
        action={
          <Button size="sm" variant="outline" onClick={() => setEditingHours(true)}>
            요일별 영업시간
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_300px] xl:items-start">
        <div className="surface p-5 sm:p-7">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => move(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-700 text-ink-300 hover:border-brand-500 hover:text-white"
            >
              ‹
            </button>
            <div className="font-display text-lg tracking-tightest text-white">
              {year}년 {month + 1}월
            </div>
            <button
              type="button"
              onClick={() => move(1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-700 text-ink-300 hover:border-brand-500 hover:text-white"
            >
              ›
            </button>
          </div>

          {bookings.error && (
            <p
              role="alert"
              className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300"
            >
              {bookings.error}{' '}
              <button type="button" onClick={bookings.reload} className="underline">
                다시 시도
              </button>
            </p>
          )}

          <div
            className={cn(
              'mt-6 grid grid-cols-7 gap-1.5 transition-opacity',
              bookings.loading && 'opacity-50',
            )}
          >
            {DAY_KEYS.map((day, i) => (
              <div
                key={day}
                className={cn(
                  'pb-2 text-center text-[11px] font-bold uppercase tracking-wider',
                  i === 0 ? 'text-brand-500' : 'text-ink-500',
                )}
              >
                {t(`days.${day}`)}
              </div>
            ))}

            {cells.map((date, i) => {
              if (!date) return <div key={`e-${i}`} />

              const key = toDateKey(date)
              const dayBookings = bookingsByDate.get(key) ?? []
              const override = overrideByDate.get(key)
              // 날짜 예외가 요일 기본값을 덮어씁니다 (SlotService.resolveBusinessHours 와 같은 규칙).
              const closed =
                override?.type === 'HOLIDAY' ||
                (!override && closedWeekdays.has(date.getDay()))
              const isToday = key === toDateKey(new Date())

              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setEditingDate(key)}
                  title="클릭해서 휴무·특별영업 지정"
                  className={cn(
                    'min-h-[92px] rounded-lg border p-2 text-left transition-colors',
                    closed
                      ? 'border-ink-800 bg-ink-950/60'
                      : 'border-ink-800 bg-ink-900/40 hover:border-brand-700',
                    isToday && 'border-brand-600',
                    override && 'ring-1 ring-brand-700/50',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'text-xs font-bold',
                        closed ? 'text-ink-700' : 'text-ink-200',
                        isToday && 'text-brand-400',
                      )}
                    >
                      {date.getDate()}
                    </span>
                    {override ? (
                      <OverrideBadge override={override} />
                    ) : (
                      closed && (
                        <span className="text-[9px] uppercase text-ink-700">
                          {t('admin.dayOff')}
                        </span>
                      )
                    )}
                  </div>

                  <div className="mt-1.5 space-y-1">
                    {dayBookings.slice(0, 2).map((b) => (
                      <div
                        key={b.bookingCode}
                        className="truncate rounded bg-brand-600/20 px-1.5 py-0.5 text-[10px] text-brand-200"
                        title={`${b.name} · ${b.productName}`}
                      >
                        {formatTime(b.startAt)} {b.name}
                      </div>
                    ))}
                    {dayBookings.length > 2 && (
                      <div className="px-1.5 text-[10px] text-ink-500">
                        +{dayBookings.length - 2}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <aside className="surface p-6">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-500">
            {t('admin.weekday')}
          </h2>

          <AsyncBoundary
            loading={availability.loading}
            error={availability.error}
            onRetry={availability.reload}
          >
            <ul className="mt-5 space-y-2.5">
              {DAY_KEYS.map((day) => {
                const row = (availability.data ?? []).find(
                  (a) => a.dayOfWeek === WEEKDAY_OF[day],
                )
                return (
                  <li
                    key={day}
                    className="flex items-center justify-between gap-3 rounded-lg border border-ink-800 px-4 py-3"
                  >
                    <span className="text-sm font-semibold text-white">{t(`days.${day}`)}</span>
                    {row?.active && row.openTime && row.closeTime ? (
                      <span className="text-xs text-ink-300">
                        {row.openTime} – {row.closeTime}
                      </span>
                    ) : (
                      <Badge tone="danger">{t('admin.dayOff')}</Badge>
                    )}
                  </li>
                )
              })}
            </ul>
          </AsyncBoundary>

          <div className="mt-6 border-t border-ink-800 pt-5">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-500">
              {t('admin.status')}
            </h3>
            <ul className="mt-4 space-y-2 text-xs">
              {(['REQUESTED', 'CONFIRMED', 'COMPLETED'] as const).map((s) => (
                <li key={s} className="flex items-center justify-between">
                  <Badge tone={STATUS_TONE[s]}>
                    {t(`admin.status${s.charAt(0) + s.slice(1).toLowerCase()}`)}
                  </Badge>
                  <span className="text-ink-500">
                    {monthBookings.filter((b) => b.status === s).length}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {editingHours && (
        <WeeklyHoursModal
          week={availability.data ?? []}
          onClose={() => setEditingHours(false)}
          onSaved={() => {
            setEditingHours(false)
            availability.reload()
            // 영업시간이 바뀌면 휴무 표시가 달라지므로 달력도 다시 그립니다.
            bookings.reload()
          }}
        />
      )}

      {editingDate && (
        <OverrideModal
          date={editingDate}
          existing={overrideByDate.get(editingDate) ?? null}
          onClose={() => setEditingDate(null)}
          onSaved={() => {
            setEditingDate(null)
            overrides.reload()
          }}
        />
      )}
    </>
  )
}
