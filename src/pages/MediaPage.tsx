import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale, useLocalePath } from '@/hooks/useLocale'
import { cn, formatDate } from '@/lib/utils'
import type { Locale } from '@/i18n'
import type { Post, PostCategory } from '@/types'
import { EmptyBlock, LoadingBlock, PageHeader, Photo, Section } from '@/components/ui/primitives'

/** 카테고리 라벨(한/일). 서버 enum → 표시 이름. */
const CATEGORY_LABEL: Record<PostCategory, { ko: string; ja: string }> = {
  SPONSOR: { ko: '협찬사', ja: 'スポンサー' },
  STORY: { ko: '스토리', ja: 'ストーリー' },
  CREW: { ko: '크루 이야기', ja: 'クルーの話' },
  ETC: { ko: '기타', ja: 'その他' },
  NOTICE: { ko: '공지', ja: 'お知らせ' },
  MEDIA: { ko: '미디어', ja: 'メディア' },
}

function catLabel(cat: PostCategory | undefined, locale: Locale): string {
  if (!cat) return ''
  return CATEGORY_LABEL[cat]?.[locale === 'ja' ? 'ja' : 'ko'] ?? ''
}

export default function MediaPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const lp = useLocalePath()
  const [cat, setCat] = useState<'ALL' | PostCategory>('ALL')

  const { data, isLoading } = useQuery({
    queryKey: ['posts', locale],
    queryFn: () => api.getPosts(locale),
  })

  // 데이터에 실제로 있는 카테고리만 필터 버튼으로 노출합니다.
  const catList = useMemo<Array<'ALL' | PostCategory>>(
    () => ['ALL', ...Array.from(new Set((data ?? []).map((p) => p.category).filter(Boolean) as PostCategory[]))],
    [data],
  )

  const filtered = useMemo(
    () => (data ?? []).filter((p) => (cat === 'ALL' ? true : p.category === cat)),
    [data, cat],
  )

  return (
    <>
      <PageHeader eyebrow={t('media.subtitle')} title={t('media.title')} desc={t('media.desc')} />

      <Section>
        {/* 카테고리 필터 */}
        {catList.length > 1 && (
          <div className="mb-9 flex flex-wrap gap-2">
            {catList.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={cn(
                  'rounded-full border px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors',
                  cat === c
                    ? 'border-brand-500 bg-brand-600 text-white'
                    : 'border-ink-800 text-ink-400 hover:border-ink-600 hover:text-white',
                )}
              >
                {c === 'ALL' ? t('media.seriesAll') : catLabel(c, locale)}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <LoadingBlock label={t('common.loading')} />
        ) : filtered.length === 0 ? (
          <EmptyBlock label={t('common.empty')} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((post) => (
              <MediaCard key={post.id} post={post} locale={locale} lp={lp} />
            ))}
          </div>
        )}
      </Section>
    </>
  )
}

/** SNS 카드는 외부(유튜브)로, 글 카드는 상세 페이지로 이동합니다. */
function MediaCard({
  post,
  locale,
  lp,
}: {
  post: Post
  locale: Locale
  lp: (p: string) => string
}) {
  const isSns = post.kind === 'SNS' && !!post.linkUrl

  const inner = (
    <>
      <div className="relative">
        <Photo
          src={post.thumbnailUrl}
          seed={post.thumbnailSeed}
          alt={post.title}
          className="aspect-video w-full"
        />
        {isSns && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600/90 text-white transition-transform group-hover:scale-110">
              ▶
            </span>
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider">
          <span className="text-brand-400">{catLabel(post.category, locale)}</span>
          {post.series && (
            <>
              <span className="text-ink-700">·</span>
              <span className="text-ink-500">{post.series}</span>
            </>
          )}
        </div>
        <h3 className="mt-3 text-base font-bold leading-snug text-white group-hover:text-brand-300">
          {post.title}
        </h3>
        {!isSns && post.excerpt && (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-400">{post.excerpt}</p>
        )}
        <p className="mt-5 text-xs text-ink-600">
          {isSns
            ? locale === 'ja'
              ? 'YouTube で見る →'
              : 'YouTube에서 보기 →'
            : formatDate(post.publishedAt, locale)}
        </p>
      </div>
    </>
  )

  const className = 'surface surface-hover group overflow-hidden'

  return isSns ? (
    <a href={post.linkUrl ?? '#'} target="_blank" rel="noreferrer noopener" className={className}>
      {inner}
    </a>
  ) : (
    <Link to={lp(`/media/${post.slug}`)} className={className}>
      {inner}
    </Link>
  )
}
