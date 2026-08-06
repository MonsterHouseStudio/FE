import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocale } from '@/hooks/useLocale'
import { cn, toDateKey } from '@/lib/utils'
import { earliestBookableDate, isSelectableDate, latestBookableDate } from '@/lib/bookingPolicy'

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

interface Props {
  value: string | null
  onChange: (dateKey: string) => void
}

/**
 * 네이버 예약형 달력.
 * 선택 가능한 날짜만 강조하고, 휴무·기간 밖은 비활성으로 보여줍니다.
 */
export default function Calendar({ value, onChange }: Props) {
  const { t } = useTranslation()
  const locale = useLocale()
  const [cursor, setCursor] = useState(() => {
    // 선택값이 없으면 "예약 가능한 첫 날"이 있는 달에서 시작합니다.
    // 그냥 이번 달로 열면 월말에는 고를 수 있는 날이 하나도 없는 달이 보입니다.
    const d = value ? new Date(value + 'T00:00:00') : earliestBookableDate()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const { cells, monthLabel, canGoPrev, canGoNext } = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    const minDate = earliestBookableDate()
    const maxDate = latestBookableDate()

    const list: ({ date: Date; disabled: boolean } | null)[] = []
    for (let i = 0; i < firstDay.getDay(); i++) list.push(null)

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d)
      list.push({ date, disabled: !isSelectableDate(date) })
    }

    const label =
      locale === 'ja' ? `${year}年 ${month + 1}月` : `${year}년 ${month + 1}월`

    const prevMonthEnd = new Date(year, month, 0)
    const nextMonthStart = new Date(year, month + 1, 1)

    return {
      cells: list,
      monthLabel: label,
      canGoPrev: prevMonthEnd >= minDate,
      canGoNext: nextMonthStart <= maxDate,
    }
  }, [cursor, locale])

  const move = (delta: number) =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1))

  return (
    <div className="surface p-5 sm:p-7">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => move(-1)}
          disabled={!canGoPrev}
          aria-label={t('common.prev')}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-700 text-ink-300 transition-colors hover:border-brand-500 hover:text-white disabled:opacity-25 disabled:hover:border-ink-700"
        >
          ‹
        </button>
        <div className="font-display text-lg tracking-tightest text-white">{monthLabel}</div>
        <button
          type="button"
          onClick={() => move(1)}
          disabled={!canGoNext}
          aria-label={t('common.next')}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-700 text-ink-300 transition-colors hover:border-brand-500 hover:text-white disabled:opacity-25 disabled:hover:border-ink-700"
        >
          ›
        </button>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-1 text-center">
        {DAY_KEYS.map((day, i) => (
          <div
            key={day}
            className={cn(
              'pb-3 text-[11px] font-bold uppercase tracking-wider',
              i === 0 ? 'text-brand-500' : 'text-ink-500',
            )}
          >
            {t(`days.${day}`)}
          </div>
        ))}

        {cells.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} />

          const key = toDateKey(cell.date)
          const selected = key === value
          const isToday = key === toDateKey(new Date())

          return (
            <button
              key={key}
              type="button"
              disabled={cell.disabled}
              onClick={() => onChange(key)}
              className={cn(
                'relative aspect-square rounded-lg text-sm font-semibold transition-all',
                cell.disabled && 'cursor-not-allowed text-ink-700 line-through decoration-ink-800',
                !cell.disabled && !selected && 'text-ink-200 hover:bg-ink-800',
                selected && 'bg-brand-600 text-white shadow-lg shadow-brand-950',
              )}
            >
              {cell.date.getDate()}
              {isToday && !selected && (
                <span className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand-500" />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-6 flex items-center gap-5 border-t border-ink-800 pt-5 text-[11px] text-ink-500">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />
          {t('booking.legendAvailable')}
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-ink-700" />
          {t('booking.legendClosed')}
        </span>
      </div>
    </div>
  )
}
