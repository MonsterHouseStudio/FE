import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale, useLocalePath } from '@/hooks/useLocale'
import { daysUntil, formatDate, formatDateShort, formatPrice } from '@/lib/utils'
import { ButtonLink } from '@/components/ui/Button'
import { Badge, Photo, Section, Spinner } from '@/components/ui/primitives'
import LogoMark from '@/components/layout/Logo'
import HeroCarousel from '@/components/home/HeroCarousel'

export default function HomePage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const lp = useLocalePath()

  const { data: products } = useQuery({
    queryKey: ['products', locale],
    queryFn: () => api.getProducts(locale),
  })
  const { data: gallery } = useQuery({
    queryKey: ['gallery', locale],
    queryFn: () => api.getGallery(locale),
  })
  const { data: competitions } = useQuery({
    queryKey: ['competitions', locale],
    queryFn: () => api.getCompetitions(locale),
  })
  const { data: posts } = useQuery({
    queryKey: ['posts', locale],
    queryFn: () => api.getPosts(locale),
  })
  const { data: banners } = useQuery({
    queryKey: ['banners', locale],
    queryFn: () => api.getBanners(locale),
  })

  const upcoming = (competitions ?? [])
    .filter((c) => daysUntil(c.startDate) >= 0)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 3)

  return (
    <>
      {/* ============ HERO ============ */}
      <HeroCarousel banners={banners ?? []} />

      {/* 통계 스트립 */}
      <section className="border-y border-ink-800 bg-ink-950">
        <div className="container-mh grid grid-cols-2 divide-x divide-ink-800 lg:grid-cols-4">
          {[
            { value: '480+', label: t('home.statsShoots') },
            { value: '120+', label: t('home.statsAthletes') },
            { value: '4', label: t('home.statsYears') },
            { value: 'KR · JP', label: t('home.statsCountries') },
          ].map((stat, i) => (
            <div key={i} className="px-4 py-7 text-center sm:py-9">
              <div className="font-display text-2xl tracking-tightest text-white sm:text-4xl">
                {stat.value}
              </div>
              <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-ink-500 sm:text-xs">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ SERVICES ============ */}
      <Section
        eyebrow={t('home.servicesEyebrow')}
        title={t('home.servicesTitle')}
        desc={t('home.servicesDesc')}
        action={
          <ButtonLink to={lp('/shooting')} variant="outline" size="sm">
            {t('home.heroCtaSub')}
          </ButtonLink>
        }
      >
        {!products ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {products.map((product, i) => (
              <Link
                key={product.id}
                to={`${lp('/shooting/booking')}?product=${product.id}`}
                className="surface surface-hover group flex flex-col overflow-hidden"
              >
                <Photo seed={product.id * 4} className="aspect-[4/3] w-full" />
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xs text-brand-500">
                      0{i + 1}
                    </span>
                    <Badge tone="brand">{t('common.minutes', { count: product.durationMin })}</Badge>
                  </div>
                  <h3 className="mt-3 font-display text-xl tracking-tightest text-white">
                    {product.name}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-400">
                    {product.description}
                  </p>
                  <div className="mt-6 flex items-center justify-between border-t border-ink-800 pt-4">
                    <span className="font-display text-lg tracking-tightest text-white">
                      {formatPrice(product.price, locale)}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-400 transition-transform group-hover:translate-x-1">
                      {t('shooting.book')} →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* ============ KOREA × JAPAN ============ */}
      <section className="relative overflow-hidden border-y border-ink-800 bg-gradient-to-r from-brand-950 via-ink-950 to-ink-950">
        <div className="container-mh grid gap-12 py-20 sm:py-28 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow">{t('home.bridgeEyebrow')}</p>
            <h2 className="heading-md mt-4 whitespace-pre-line text-white">
              {t('home.bridgeTitle')}
            </h2>
            <p className="mt-6 max-w-lg text-sm leading-relaxed text-ink-300">
              {t('home.bridgeDesc')}
            </p>
            <div className="mt-9">
              <ButtonLink to={lp('/interpreter')} size="lg">
                {t('home.bridgeCta')}
              </ButtonLink>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 국기 이모지는 Windows 에서 국기로 렌더링되지 않아
                플랫폼마다 다르게 보입니다. 국가 코드 타이포로 대체했습니다. */}
            {[
              { code: 'KR', label: 'SEOUL', sub: t('schedule.korea') },
              { code: 'JP', label: 'TOKYO', sub: t('schedule.japan') },
            ].map((item) => (
              <div key={item.label} className="surface p-6 sm:p-8">
                <div className="inline-flex h-10 items-center rounded-lg border border-brand-700/60 bg-brand-950/60 px-3 font-display text-sm tracking-[0.15em] text-brand-300">
                  {item.code}
                </div>
                <div className="mt-4 font-display text-xl tracking-tightest text-white sm:text-2xl">
                  {item.label}
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-ink-500">
                  {item.sub}
                </div>
              </div>
            ))}
            <div className="surface col-span-2 p-6">
              <p className="text-sm text-ink-300">{t('interpreter.lineDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ GALLERY ============ */}
      <Section
        eyebrow={t('home.galleryEyebrow')}
        title={t('home.galleryTitle')}
        action={
          <ButtonLink to={lp('/gallery')} variant="outline" size="sm">
            {t('home.galleryCta')}
          </ButtonLink>
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {(gallery ?? []).slice(0, 8).map((item) => (
            <Link
              key={item.id}
              to={lp('/gallery')}
              className="group relative overflow-hidden rounded-lg"
            >
              <Photo
                src={item.thumbUrl}
                seed={item.seed}
                alt={item.caption}
                className="aspect-[3/4] w-full transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <p className="absolute bottom-3 left-3 right-3 translate-y-2 text-[11px] leading-snug text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                {item.caption}
              </p>
            </Link>
          ))}
        </div>
      </Section>

      {/* ============ SCHEDULE ============ */}
      <Section
        className="border-t border-ink-800 bg-ink-900/30"
        eyebrow={t('home.scheduleEyebrow')}
        title={t('home.scheduleTitle')}
        action={
          <ButtonLink to={lp('/schedule')} variant="outline" size="sm">
            {t('home.scheduleCta')}
          </ButtonLink>
        }
      >
        <div className="space-y-3">
          {upcoming.map((comp) => {
            const d = daysUntil(comp.startDate)
            return (
              <Link
                key={comp.id}
                to={lp('/schedule')}
                className="surface surface-hover flex flex-wrap items-center gap-4 p-5 sm:gap-8 sm:p-6"
              >
                <div className="w-20 shrink-0">
                  <div className="font-display text-2xl tracking-tightest text-brand-500">
                    {d === 0 ? t('schedule.ddayToday') : `D-${d}`}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge tone={comp.country === 'KR' ? 'brand' : 'neutral'}>
                      {comp.country === 'KR' ? t('schedule.korea') : t('schedule.japan')}
                    </Badge>
                    <span className="text-xs text-ink-500">
                      {formatDateShort(comp.startDate, locale)}
                    </span>
                  </div>
                  <h3 className="mt-2 truncate text-base font-bold text-white">{comp.name}</h3>
                  <p className="mt-1 truncate text-xs text-ink-400">{comp.place}</p>
                </div>
                <span className="hidden text-xs font-bold uppercase tracking-wider text-ink-500 sm:block">
                  →
                </span>
              </Link>
            )
          })}
        </div>
      </Section>

      {/* ============ MEDIA ============ */}
      <Section
        eyebrow={t('home.mediaEyebrow')}
        title={t('home.mediaTitle')}
        action={
          <ButtonLink to={lp('/media')} variant="outline" size="sm">
            {t('home.mediaCta')}
          </ButtonLink>
        }
      >
        <div className="grid gap-5 md:grid-cols-3">
          {(posts ?? []).slice(0, 3).map((post) => (
            <Link
              key={post.id}
              to={lp(`/media/${post.slug}`)}
              className="surface surface-hover group overflow-hidden"
            >
              <Photo src={post.thumbnailUrl} seed={post.thumbnailSeed} alt={post.title} className="aspect-[16/10] w-full" />
              <div className="p-6">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-brand-400">
                  <span>{post.series}</span>
                  <span className="text-ink-700">·</span>
                  <span className="text-ink-500">{formatDate(post.publishedAt, locale)}</span>
                </div>
                <h3 className="mt-3 text-base font-bold leading-snug text-white group-hover:text-brand-300">
                  {post.title}
                </h3>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-400">
                  {post.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* ============ CTA ============ */}
      <section className="border-t border-ink-800 bg-brand-950/40">
        <div className="container-mh flex flex-col items-center gap-7 py-20 text-center sm:py-28">
          <LogoMark className="h-12 w-12 text-brand-600" />
          <h2 className="heading-md max-w-2xl text-white">{t('home.ctaTitle')}</h2>
          <p className="max-w-md text-sm text-ink-400">{t('home.ctaDesc')}</p>
          <ButtonLink to={lp('/shooting/booking')} size="lg">
            {t('home.heroCta')}
          </ButtonLink>
        </div>
      </section>
    </>
  )
}
