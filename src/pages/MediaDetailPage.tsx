import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale, useLocalePath } from '@/hooks/useLocale'
import { formatDate } from '@/lib/utils'
import { ButtonLink } from '@/components/ui/Button'
import { Badge, LoadingBlock, Photo, Section } from '@/components/ui/primitives'

export default function MediaDetailPage() {
  const { t } = useTranslation()
  const { slug } = useParams<{ slug: string }>()
  const locale = useLocale()
  const lp = useLocalePath()

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', slug, locale],
    queryFn: () => api.getPost(slug!, locale),
    enabled: !!slug,
  })

  const { data: posts } = useQuery({
    queryKey: ['posts', locale],
    queryFn: () => api.getPosts(locale),
  })

  if (isLoading) {
    return (
      <div className="container-mh py-28">
        <LoadingBlock label={t('common.loading')} />
      </div>
    )
  }

  // 기획서 §3.2 — 요청 언어에 번역이 없는 글은 목록에서 제외되지만,
  // 직접 URL 로 들어온 경우를 대비해 안내 화면을 둡니다.
  if (!post) {
    return (
      <div className="container-mh flex flex-col items-center gap-6 py-28 text-center">
        <Badge tone="warning">{t('media.notTranslated')}</Badge>
        <h1 className="heading-md text-white">{t('notFound.title')}</h1>
        <ButtonLink to={lp('/media')} variant="outline">
          {t('media.backToList')}
        </ButtonLink>
      </div>
    )
  }

  const related = (posts ?? []).filter((p) => p.slug !== post.slug).slice(0, 3)

  return (
    <>
      <article>
        <header className="border-b border-ink-800 bg-gradient-to-b from-ink-900 to-ink-950">
          <div className="container-mh py-14 sm:py-20">
            <Link
              to={lp('/media')}
              className="text-xs font-bold uppercase tracking-wider text-ink-500 transition-colors hover:text-brand-400"
            >
              ← {t('media.backToList')}
            </Link>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Badge tone="brand">{post.series}</Badge>
              <span className="text-xs text-ink-500">
                {t('media.publishedAt')} {formatDate(post.publishedAt, locale)}
              </span>
              <span className="text-xs text-ink-600">
                {t('common.viewCount', { count: post.viewCount })}
              </span>
            </div>

            <h1 className="heading-lg mt-5 max-w-3xl text-white">{post.title}</h1>
          </div>
        </header>

        <div className="container-mh py-12 sm:py-16">
          <Photo src={post.thumbnailUrl} seed={post.thumbnailSeed} alt={post.title} className="aspect-[21/9] w-full rounded-xl" />

          <div className="mx-auto mt-12 max-w-2xl">
            <p className="border-l-2 border-brand-600 pl-6 text-base leading-relaxed text-ink-200 sm:text-lg">
              {post.excerpt}
            </p>

            {/* 목록 응답에는 body 가 없습니다(상세에서만 옵니다). 방어적으로 처리합니다. */}
            <div className="mt-10 space-y-6">
              {(post.body ?? '').split('\n\n').filter(Boolean).map((para, i) => (
                <p key={i} className="text-sm leading-[1.9] text-ink-300 sm:text-base">
                  {para}
                </p>
              ))}
            </div>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <Section className="border-t border-ink-800 bg-ink-900/30" eyebrow="MORE" title={t('media.title')}>
          <div className="grid gap-5 sm:grid-cols-3">
            {related.map((p) => (
              <Link
                key={p.id}
                to={lp(`/media/${p.slug}`)}
                className="surface surface-hover group overflow-hidden"
              >
                <Photo src={p.thumbnailUrl} seed={p.thumbnailSeed} alt={p.title} className="aspect-[16/10] w-full" />
                <div className="p-6">
                  <span className="text-[11px] uppercase tracking-wider text-brand-400">
                    {p.series}
                  </span>
                  <h3 className="mt-2 text-sm font-bold leading-snug text-white group-hover:text-brand-300">
                    {p.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </>
  )
}
