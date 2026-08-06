import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from '@/hooks/useLocale'
import { cn, daysUntil, formatDate } from '@/lib/utils'
import type { Country } from '@/types'
import { Badge, EmptyBlock, LoadingBlock, PageHeader, Section } from '@/components/ui/primitives'

type Tab = 'upcoming' | 'past'
type CountryFilter = 'ALL' | Country

export default function SchedulePage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const [tab, setTab] = useState<Tab>('upcoming')
  const [country, setCountry] = useState<CountryFilter>('ALL')

  const { data, isLoading } = useQuery({
    queryKey: ['competitions', locale],
    queryFn: () => api.getCompetitions(locale),
  })

  const list = useMemo(() => {
    const all = data ?? []
    return all
      .filter((c) => (tab === 'upcoming' ? daysUntil(c.startDate) >= 0 : daysUntil(c.startDate) < 0))
      .filter((c) => (country === 'ALL' ? true : c.country === country))
      .sort((a, b) =>
        tab === 'upcoming'
          ? a.startDate.localeCompare(b.startDate)
          : b.startDate.localeCompare(a.startDate),
      )
  }, [data, tab, country])

  const countryFilters: { key: CountryFilter; label: string }[] = [
    { key: 'ALL', label: t('common.all') },
    { key: 'KR', label: t('schedule.korea') },
    { key: 'JP', label: t('schedule.japan') },
  ]

  return (
    <>
      <PageHeader
        eyebrow={t('schedule.subtitle')}
        title={t('schedule.title')}
        desc={t('schedule.desc')}
      />

      <Section>
        {/* 필터 */}
        <div className="mb-9 flex flex-wrap items-center justify-between gap-5">
          <div className="flex rounded-full border border-ink-700 p-1">
            {(['upcoming', 'past'] as Tab[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  'rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors',
                  tab === key ? 'bg-brand-600 text-white' : 'text-ink-400 hover:text-white',
                )}
              >
                {t(`schedule.${key}`)}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {countryFilters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setCountry(f.key)}
                className={cn(
                  'rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors',
                  country === f.key
                    ? 'border-brand-500 text-white'
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
        ) : list.length === 0 ? (
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
                  {/* 날짜 블록 */}
                  <div className="flex flex-row items-center gap-4 border-ink-800 sm:flex-col sm:items-start sm:border-r sm:pr-6">
                    <div>
                      <div className="font-display text-3xl leading-none tracking-tightest text-white">
                        {new Date(comp.startDate).getDate()}
                      </div>
                      <div className="mt-1.5 text-[11px] uppercase tracking-[0.2em] text-ink-500">
                        {locale === 'ja'
                          ? `${new Date(comp.startDate).getMonth() + 1}月`
                          : `${new Date(comp.startDate).getMonth() + 1}월`}
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

                  {/* 본문 */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={comp.country === 'KR' ? 'brand' : 'neutral'}>
                        {comp.country === 'KR' ? t('schedule.korea') : t('schedule.japan')}
                      </Badge>
                      <span className="text-xs text-ink-500">
                        {formatDate(comp.startDate, locale)}
                        {multiDay && ` – ${formatDate(comp.endDate, locale)}`}
                      </span>
                    </div>

                    <h2 className="mt-3 font-display text-xl tracking-tightest text-white sm:text-2xl">
                      {comp.name}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-ink-400">{comp.description}</p>

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
      </Section>
    </>
  )
}
