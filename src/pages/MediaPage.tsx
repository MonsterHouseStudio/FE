import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale, useLocalePath } from '@/hooks/useLocale'
import { cn, formatDate } from '@/lib/utils'
import { EmptyBlock, LoadingBlock, PageHeader, Photo, Section } from '@/components/ui/primitives'

export default function MediaPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const lp = useLocalePath()
  const [series, setSeries] = useState<string>('ALL')

  const { data, isLoading } = useQuery({
    queryKey: ['posts', locale],
    queryFn: () => api.getPosts(locale),
  })

  const seriesList = useMemo(
    () => ['ALL', ...Array.from(new Set((data ?? []).map((p) => p.series)))],
    [data],
  )

  const filtered = useMemo(
    () => (data ?? []).filter((p) => (series === 'ALL' ? true : p.series === series)),
    [data, series],
  )

  const [featured, ...rest] = filtered

  return (
    <>
      <PageHeader eyebrow={t('media.subtitle')} title={t('media.title')} desc={t('media.desc')} />

      <Section>
        {/* 시리즈 필터 */}
        <div className="mb-9 flex flex-wrap gap-2">
          {seriesList.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeries(s)}
              className={cn(
                'rounded-full border px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors',
                series === s
                  ? 'border-brand-500 bg-brand-600 text-white'
                  : 'border-ink-800 text-ink-400 hover:border-ink-600 hover:text-white',
              )}
            >
              {s === 'ALL' ? t('media.seriesAll') : s}
            </button>
          ))}
        </div>

        {isLoading ? (
          <LoadingBlock label={t('common.loading')} />
        ) : filtered.length === 0 ? (
          <EmptyBlock label={t('common.empty')} />
        ) : (
          <div className="space-y-10">
            {/* 대표 글 */}
            {featured && (
              <Link
                to={lp(`/media/${featured.slug}`)}
                className="surface surface-hover group grid overflow-hidden lg:grid-cols-2"
              >
                <Photo src={featured.thumbnailUrl} seed={featured.thumbnailSeed} alt={featured.title} className="aspect-[16/10] w-full lg:aspect-auto" />
                <div className="flex flex-col justify-center p-8 sm:p-12">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider">
                    <span className="text-brand-400">{featured.series}</span>
                    <span className="text-ink-700">·</span>
                    <span className="text-ink-500">{formatDate(featured.publishedAt, locale)}</span>
                  </div>
                  <h2 className="mt-4 font-display text-2xl leading-tight tracking-tightest text-white group-hover:text-brand-300 sm:text-3xl">
                    {featured.title}
                  </h2>
                  <p className="mt-5 text-sm leading-relaxed text-ink-400">{featured.excerpt}</p>
                  <div className="mt-7 flex items-center gap-4 text-xs text-ink-600">
                    <span>{t('common.viewCount', { count: featured.viewCount })}</span>
                    <span className="font-bold uppercase tracking-wider text-brand-400 transition-transform group-hover:translate-x-1">
                      {t('media.readMore')} →
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* 나머지 */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <Link
                  key={post.id}
                  to={lp(`/media/${post.slug}`)}
                  className="surface surface-hover group overflow-hidden"
                >
                  <Photo src={post.thumbnailUrl} seed={post.thumbnailSeed} alt={post.title} className="aspect-[16/10] w-full" />
                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider">
                      <span className="text-brand-400">{post.series}</span>
                      <span className="text-ink-700">·</span>
                      <span className="text-ink-500">{formatDate(post.publishedAt, locale)}</span>
                    </div>
                    <h3 className="mt-3 text-base font-bold leading-snug text-white group-hover:text-brand-300">
                      {post.title}
                    </h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-400">
                      {post.excerpt}
                    </p>
                    <p className="mt-5 text-xs text-ink-600">
                      {t('common.viewCount', { count: post.viewCount })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Section>
    </>
  )
}
