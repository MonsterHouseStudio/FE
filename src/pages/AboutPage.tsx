import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from '@/hooks/useLocale'
import { cn } from '@/lib/utils'
import { ButtonAnchor } from '@/components/ui/Button'
import { Photo, Section } from '@/components/ui/primitives'
import { Reveal } from '@/components/ui/Reveal'

const YOUTUBE = import.meta.env.VITE_YOUTUBE_CHANNEL_URL ?? 'https://www.youtube.com'

export default function AboutPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const { data } = useQuery({
    queryKey: ['about', locale],
    queryFn: () => api.getAbout(locale),
  })

  const intro = data?.intro
  const crew = data?.crew ?? []
  const videos = data?.videos ?? []

  const introTitle = intro?.title || t('about.introTitle')
  const introDesc = intro?.description || t('about.introDesc')

  return (
    <>
      {/* 히어로 — ABOUT · 로고 · 소개 문구 · 콜라주를 한 섹션으로 (진입 즉시 카드 노출) */}
      <section className="relative overflow-hidden border-b border-ink-800">
        <div className="container-mh grid items-center gap-12 py-14 sm:py-16 lg:min-h-[calc(100dvh-4.5rem)] lg:grid-cols-2 lg:gap-8 lg:py-10">
          <div>
            <p className="eyebrow">{t('about.subtitle')}</p>
            <img
              src="/mh-logo.png"
              alt="MONSTER HOUSE"
              className="mt-6 h-28 w-auto sm:h-32 lg:h-36"
            />
            <h1 className="heading-lg mt-8 text-white">{introTitle}</h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-ink-300 sm:text-base">
              {introDesc}
            </p>
          </div>

          <IntroCollage photos={[intro?.photo1Url, intro?.photo2Url, intro?.photo3Url]} />
        </div>
      </section>

      {/* 크루 */}
      {crew.length > 0 && (
        <Section className="border-t border-ink-800 bg-ink-900/30" eyebrow="CREW" title={t('about.crewTitle')}>
          <div className="grid gap-5 sm:grid-cols-3">
            {crew.map((member, i) => (
              <Reveal key={member.id} delay={i * 90}>
                <div className="group surface h-full overflow-hidden transition-transform duration-500 hover:-translate-y-1.5">
                  {member.photoUrl ? (
                    <img
                      src={member.photoUrl}
                      alt={member.name}
                      className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <Photo seed={member.id + 20} className="aspect-[4/5] w-full" />
                  )}
                  <div className="p-6">
                    <h3 className="font-display text-lg tracking-tightest text-white">{member.name}</h3>
                    {member.role && (
                      <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-brand-400">{member.role}</p>
                    )}
                    {member.bio && <p className="mt-4 text-sm leading-relaxed text-ink-400">{member.bio}</p>}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      {/* 유튜브 */}
      {videos.length > 0 && (
        <Section
          eyebrow="YOUTUBE"
          title={t('about.youtubeTitle')}
          action={
            <ButtonAnchor href={YOUTUBE} variant="outline" size="sm">
              {t('about.youtubeCta')}
            </ButtonAnchor>
          }
        >
          <div className="grid gap-5 sm:grid-cols-3">
            {videos.map((video, i) => (
              <Reveal key={video.id} delay={i * 90}>
                <a
                  href={video.youtubeUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group surface surface-hover block h-full overflow-hidden"
                >
                  <div className="relative">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="aspect-video w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <Photo seed={video.id + 40} className="aspect-video w-full" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600/90 text-white transition-transform group-hover:scale-110">
                        ▶
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-sm font-semibold leading-snug text-white">{video.title || 'MONSTER HOUSE'}</p>
                    <p className="mt-2 text-xs text-ink-500">MONSTER HOUSE</p>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </Section>
      )}
    </>
  )
}

/**
 * 기울어져 떠있는 3장 콜라주(크게, 진입 즉시 노출).
 * 바깥 div = 위치 + 기울임(rotate), 안쪽 div = 부유(translateY) → 합성.
 * prefers-reduced-motion 이면 float 정지.
 */
function IntroCollage({ photos }: { photos: (string | null | undefined)[] }) {
  return (
    <div className="relative mx-auto h-[420px] w-full max-w-xl sm:h-[520px] lg:h-[600px]">
      {/* 뒤에 은은한 브랜드 글로우 */}
      <div className="pointer-events-none absolute inset-6 rounded-full bg-brand-700/25 blur-3xl" />

      <FloatCard
        url={photos[0]}
        seed={1}
        className="absolute left-0 top-8 z-10 w-[56%] rotate-[-5deg]"
        duration={6.5}
        delay={0}
      />
      <FloatCard
        url={photos[1]}
        seed={8}
        className="absolute right-0 top-0 z-20 w-[50%] rotate-[6deg]"
        duration={7.6}
        delay={0.7}
      />
      <FloatCard
        url={photos[2]}
        seed={4}
        className="absolute bottom-0 left-[22%] z-30 w-[54%] rotate-[-3deg]"
        duration={6.9}
        delay={1.2}
      />
    </div>
  )
}

function FloatCard({
  url,
  seed,
  className,
  duration,
  delay,
}: {
  url?: string | null
  seed: number
  className?: string
  duration: number
  delay: number
}) {
  return (
    <div className={cn('will-change-transform', className)}>
      <div
        className="animate-float motion-reduce:animate-none"
        style={{ animationDuration: `${duration}s`, animationDelay: `${delay}s` }}
      >
        <div className="aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl shadow-black/60 ring-1 ring-white/10">
          {url ? (
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <Photo seed={seed} className="h-full w-full" />
          )}
        </div>
      </div>
    </div>
  )
}
