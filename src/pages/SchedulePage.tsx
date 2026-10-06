import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from '@/hooks/useLocale'
import { cn, daysUntil, formatDate } from '@/lib/utils'
import type { Competition, Country } from '@/types'
import { Badge, EmptyBlock, LoadingBlock, PageHeader, Section } from '@/components/ui/primitives'

type View = 'calendar' | 'list'
type Tab = 'upcoming' | 'past'
type CountryFilter = 'ALL' | Country

const fmt = (dt: Date) =>
  `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`

const WEEKDAYS: Record<string, string[]> = {
  ko: ['일', '월', '화', '수', '목', '금', '토'],
  ja: ['日', '月', '火', '水', '木', '金', '土'],
}

function countryTone(c: Country) {
  return c === 'KR' ? 'brand' : c === 'JP' ? 'neutral' : 'warning'
}
function countryKey(c: Country) {
  return c === 'KR' ? 'schedule.korea' : c === 'JP' ? 'schedule.japan' : 'schedule.overseas'
}

export default function SchedulePage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const [view, setView] = useState<View>('calendar')
  const [tab, setTab] = useState<Tab>('upcoming')
  const [country, setCountry] = useState<CountryFilter>('ALL')

  const { data, isLoading } = useQuery({
    queryKey: ['competitions', locale],
    queryFn: () => api.getCompetitions(locale),
  })

  const filtered = useMemo(
    () => (data ?? []).filter((c) => (country === 'ALL' ? true : c.country === country)),
    [data, country],
  )

  const countryFilters: { key: CountryFilter; label: string }[] = [
    { key: 'ALL', label: t('common.all') },
    { key: 'KR', label: t('schedule.korea') },
    { key: 'JP', label: t('schedule.japan') },
    { key: 'OVERSEAS', label: t('schedule.overseas') },
  ]

  return (
    <>
      <PageHeader
        eyebrow={t('schedule.subtitle')}
        title={t('schedule.title')}
        desc={t('schedule.desc')}
      />

      <Section>
        {/* 뷰 전환 + 국가 필터 */}
        <div className="mb-9 flex flex-wrap items-center justify-between gap-5">
          <div className="flex rounded-full border border-ink-700 p-1">
            {(['calendar', 'list'] as View[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                className={cn(
                  'rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors',
                  view === key ? 'bg-brand-600 text-white' : 'text-ink-400 hover:text-ink-50',
                )}
              >
                {t(key === 'calendar' ? 'schedule.calendarView' : 'schedule.listView')}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {countryFilters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setCountry(f.key)}
                className={cn(
                  'rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors',
                  country === f.key
                    ? 'border-brand-500 text-ink-50'
                    : 'border-ink-800 text-ink-500 hover:text-ink-200',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <LoadingBlock label={t('common.loading')} />
        ) : (data ?? []).length === 0 ? (
          <EmptyBlock label={t('common.empty')} />
        ) : view === 'calendar' ? (
          <CalendarView competitions={filtered} />
        ) : (
          <ListView competitions={filtered} tab={tab} setTab={setTab} />
        )}
      </Section>
    </>
  )
}

/* ===================== 캘린더 뷰 ===================== */

function CalendarView({ competitions }: { competitions: Competition[] }) {
  const { t } = useTranslation()
  const locale = useLocale()

  // 대회가 있는 날짜별 묶음 (startDate~endDate 범위 포함)
  const byDate = useMemo(() => {
    const map = new Map<string, Competition[]>()
    for (const c of competitions) {
      const s = new Date(c.startDate)
      const e = new Date(c.endDate)
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        const key = fmt(d)
        const arr = map.get(key) ?? []
        arr.push(c)
        map.set(key, arr)
      }
    }
    return map
  }, [competitions])

  // 기본 월: 오늘 이후 가장 가까운 대회의 달, 없으면 이번 달
  const initialMonth = useMemo(() => {
    const today = fmt(new Date())
    const upcoming = competitions
      .map((c) => c.startDate)
      .filter((d) => d >= today)
      .sort()[0]
    const base = upcoming ? new Date(upcoming) : new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  }, [competitions])

  const [month, setMonth] = useState<Date>(initialMonth)
  const [selected, setSelected] = useState<string>(() => {
    const today = fmt(new Date())
    return byDate.has(today) ? today : ''
  })

  const cells = useMemo(() => {
    const y = month.getFullYear()
    const m = month.getMonth()
    const startDow = new Date(y, m, 1).getDay()
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const out: (Date | null)[] = []
    for (let i = 0; i < startDow; i++) out.push(null)
    for (let d = 1; d <= daysInMonth; d++) out.push(new Date(y, m, d))
    while (out.length % 7 !== 0) out.push(null)
    return out
  }, [month])

  const todayStr = fmt(new Date())
  const weekdays = WEEKDAYS[locale] ?? WEEKDAYS.ko
  const monthLabel =
    locale === 'ja'
      ? `${month.getFullYear()}年 ${month.getMonth() + 1}月`
      : `${month.getFullYear()}년 ${month.getMonth() + 1}월`

  const goMonth = (delta: number) => {
    setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }

  const selectedList = selected ? (byDate.get(selected) ?? []) : []

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      {/* 달력 */}
      <div>
        <div className="mb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => goMonth(-1)}
            aria-label="이전 달"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-700 text-ink-300 transition-colors hover:border-brand-500 hover:text-ink-50"
          >
            ‹
          </button>
          <div className="font-display text-xl tracking-tight text-ink-50">{monthLabel}</div>
          <button
            type="button"
            onClick={() => goMonth(1)}
            aria-label="다음 달"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-700 text-ink-300 transition-colors hover:border-brand-500 hover:text-ink-50"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 border-l border-t border-ink-800">
          {weekdays.map((w, i) => (
            <div
              key={w}
              className={cn(
                'border-b border-r border-ink-800 py-2 text-center text-[11px] font-bold',
                i === 0 ? 'text-brand-500' : 'text-ink-500',
              )}
            >
              {w}
            </div>
          ))}
          {cells.map((cell, i) => {
            if (!cell) return <div key={i} className="border-b border-r border-ink-800 bg-ink-900/30" />
            const key = fmt(cell)
            const events = byDate.get(key)
            const isToday = key === todayStr
            const isSelected = key === selected
            const dow = cell.getDay()
            return (
              <button
                key={i}
                type="button"
                onClick={() => events && setSelected(key)}
                disabled={!events}
                className={cn(
                  'relative flex aspect-square flex-col items-center justify-start border-b border-r border-ink-800 p-1.5 transition-colors sm:p-2',
                  events ? 'cursor-pointer hover:bg-ink-800' : 'cursor-default',
                  isSelected && 'bg-brand-600/15 ring-1 ring-inset ring-brand-500',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold sm:text-sm',
                    isToday ? 'bg-brand-600 text-white' : dow === 0 ? 'text-brand-500' : 'text-ink-200',
                    !events && !isToday && 'text-ink-600',
                  )}
                >
                  {cell.getDate()}
                </span>
                {events && (
                  <span className="mt-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-brand-600/20 px-1 text-[10px] font-bold leading-4 text-brand-400">
                    {events.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-[11px] text-ink-600">
          {locale === 'ja' ? '数字は当日の大会数です。' : '숫자는 그 날의 대회 수입니다.'}
        </p>
      </div>

      {/* 선택한 날짜의 대회 */}
      <div>
        <h3 className="mb-4 font-display text-lg tracking-tight text-ink-50">
          {selected
            ? formatDate(selected, locale)
            : locale === 'ja'
              ? '日付を選んでください'
              : '날짜를 선택하세요'}
        </h3>
        {selected && selectedList.length > 0 ? (
          <div className="space-y-3">
            {selectedList
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((comp) => (
                <div key={comp.id} className="surface p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={countryTone(comp.country)}>{t(countryKey(comp.country))}</Badge>
                    {comp.startDate !== comp.endDate && (
                      <span className="text-[11px] text-ink-500">
                        {formatDate(comp.startDate, locale)} – {formatDate(comp.endDate, locale)}
                      </span>
                    )}
                  </div>
                  <h4 className="mt-2.5 font-display text-lg tracking-tightest text-ink-50">
                    {comp.name}
                  </h4>
                  {comp.description && (
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-400">{comp.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    {comp.place && (
                      <span className="text-ink-300">
                        <span className="text-ink-600">{t('schedule.place')} </span>
                        {comp.place}
                      </span>
                    )}
                    {comp.host && (
                      <span className="text-ink-300">
                        <span className="text-ink-600">{t('schedule.host')} </span>
                        {comp.host}
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-ink-800 p-8 text-center text-sm text-ink-500">
            {locale === 'ja'
              ? '大会がある日(数字)を選ぶと、ここに表示されます。'
              : '대회가 있는 날(숫자)을 선택하면 여기에 표시됩니다.'}
          </div>
        )}
      </div>
    </div>
  )
}

/* ===================== 리스트 뷰 ===================== */

function ListView({
  competitions,
  tab,
  setTab,
}: {
  competitions: Competition[]
  tab: Tab
  setTab: (t: Tab) => void
}) {
  const { t } = useTranslation()
  const locale = useLocale()

  const list = useMemo(
    () =>
      competitions
        .filter((c) =>
          tab === 'upcoming' ? daysUntil(c.startDate) >= 0 : daysUntil(c.startDate) < 0,
        )
        .sort((a, b) =>
          tab === 'upcoming'
            ? a.startDate.localeCompare(b.startDate)
            : b.startDate.localeCompare(a.startDate),
        ),
    [competitions, tab],
  )

  return (
    <>
      <div className="mb-6 flex rounded-full border border-ink-700 p-1">
        {(['upcoming', 'past'] as Tab[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors',
              tab === key ? 'bg-brand-600 text-white' : 'text-ink-400 hover:text-ink-50',
            )}
          >
            {t(`schedule.${key}`)}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyBlock label={t('common.empty')} />
      ) : (
        <div className="space-y-4">
          {list.map((comp) => {
            const d = daysUntil(comp.startDate)
            const isPast = d < 0
            const multiDay = comp.startDate !== comp.endDate
            return (
              <article
                key={comp.id}
                className={cn(
                  'surface grid gap-6 p-6 sm:grid-cols-[140px_1fr] sm:p-8',
                  isPast && 'opacity-60',
                )}
              >
                <div className="flex flex-row items-center gap-4 border-ink-800 sm:flex-col sm:items-start sm:border-r sm:pr-6">
                  <div>
                    <div className="font-display text-3xl leading-none tracking-tightest text-ink-50">
                      {new Date(comp.startDate).getDate()}
                    </div>
                    <div className="mt-1.5 text-[11px] uppercase tracking-[0.2em] text-ink-500">
                      {`${new Date(comp.startDate).getMonth() + 1}${locale === 'ja' ? '月' : '월'}`}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'font-display text-sm tracking-tightest sm:mt-2',
                      isPast ? 'text-ink-600' : 'text-brand-500',
                    )}
                  >
                    {isPast
                      ? t('schedule.ended')
                      : d === 0
                        ? t('schedule.ddayToday')
                        : t('schedule.dday', { days: d })}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={countryTone(comp.country)}>{t(countryKey(comp.country))}</Badge>
                    <span className="text-xs text-ink-500">
                      {formatDate(comp.startDate, locale)}
                      {multiDay && ` – ${formatDate(comp.endDate, locale)}`}
                    </span>
                  </div>

                  <h2 className="mt-3 font-display text-xl tracking-tightest text-ink-50 sm:text-2xl">
                    {comp.name}
                  </h2>
                  {comp.description && (
                    <p className="mt-3 text-sm leading-relaxed text-ink-400">{comp.description}</p>
                  )}

                  <dl className="mt-5 grid gap-3 border-t border-ink-800 pt-5 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-[11px] uppercase tracking-wider text-ink-600">
                        {t('schedule.place')}
                      </dt>
                      <dd className="mt-1 text-ink-200">{comp.place}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-wider text-ink-600">
                        {t('schedule.host')}
                      </dt>
                      <dd className="mt-1 text-ink-200">{comp.host}</dd>
                    </div>
                  </dl>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
