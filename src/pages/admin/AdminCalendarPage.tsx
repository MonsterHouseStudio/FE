import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ADMIN_BOOKINGS } from '@/mocks/admin'
import { cn, formatTime, toDateKey } from '@/lib/utils'
import { BOOKING_POLICY } from '@/lib/bookingPolicy'
import { Badge } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { AdminPageHeader, DemoNotice } from './AdminLayout'
import { STATUS_TONE } from './statusTone'

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

/** 기본 영업시간 — 백엔드 availability 테이블에 대응 */
const DEFAULT_HOURS = [
  { day: 'sun', open: '10:00', close: '20:00', active: true },
  { day: 'mon', open: '10:00', close: '20:00', active: false },
  { day: 'tue', open: '10:00', close: '20:00', active: true },
  { day: 'wed', open: '10:00', close: '20:00', active: true },
  { day: 'thu', open: '10:00', close: '20:00', active: true },
  { day: 'fri', open: '10:00', close: '20:00', active: true },
  { day: 'sat', open: '10:00', close: '20:00', active: true },
] as const

export default function AdminCalendarPage() {
  const { t } = useTranslation()
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, typeof ADMIN_BOOKINGS>()
    ADMIN_BOOKINGS.filter((b) => b.status !== 'CANCELED').forEach((b) => {
      const key = b.startAt.slice(0, 10)
      map.set(key, [...(map.get(key) ?? []), b])
    })
    return map
  }, [])

  const cells = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const first = new Date(year, month, 1)
    const last = new Date(year, month + 1, 0)

    const list: (Date | null)[] = Array.from({ length: first.getDay() }, () => null)
    for (let d = 1; d <= last.getDate(); d++) list.push(new Date(year, month, d))
    return list
  }, [cursor])

  const move = (delta: number) =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1))

  return (
    <>
      <AdminPageHeader
        title={t('admin.calendar')}
        action={<Button size="sm">+ {t('admin.specialDay')}</Button>}
      />
      <DemoNotice />

      <div className="grid gap-6 xl:grid-cols-[1fr_300px] xl:items-start">
        {/* 월간 캘린더 */}
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
              {cursor.getFullYear()}년 {cursor.getMonth() + 1}월
            </div>
            <button
              type="button"
              onClick={() => move(1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-700 text-ink-300 hover:border-brand-500 hover:text-white"
            >
              ›
            </button>
          </div>

          <div className="mt-6 grid grid-cols-7 gap-1.5">
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
              const closed = date.getDay() === BOOKING_POLICY.closedWeekday
              const isToday = key === toDateKey(new Date())

              return (
                <div
                  key={key}
                  className={cn(
                    'min-h-[92px] rounded-lg border p-2 transition-colors',
                    closed
                      ? 'border-ink-800 bg-ink-950/60'
                      : 'border-ink-800 bg-ink-900/40 hover:border-brand-700',
                    isToday && 'border-brand-600',
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
                    {closed && (
                      <span className="text-[9px] uppercase text-ink-700">
                        {t('admin.dayOff')}
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5 space-y-1">
                    {dayBookings.slice(0, 2).map((b) => (
                      <div
                        key={b.id}
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
                </div>
              )
            })}
          </div>
        </div>

        {/* 요일별 영업시간 */}
        <aside className="surface p-6">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-500">
            {t('admin.weekday')}
          </h2>

          <ul className="mt-5 space-y-2.5">
            {DEFAULT_HOURS.map((row) => (
              <li
                key={row.day}
                className="flex items-center justify-between gap-3 rounded-lg border border-ink-800 px-4 py-3"
              >
                <span className="text-sm font-semibold text-white">{t(`days.${row.day}`)}</span>
                {row.active ? (
                  <span className="text-xs text-ink-300">
                    {row.open} – {row.close}
                  </span>
                ) : (
                  <Badge tone="danger">{t('admin.dayOff')}</Badge>
                )}
              </li>
            ))}
          </ul>

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
                    {ADMIN_BOOKINGS.filter((b) => b.status === s).length}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </>
  )
}
