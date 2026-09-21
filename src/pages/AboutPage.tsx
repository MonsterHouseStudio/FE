import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from '@/hooks/useLocale'
import { ButtonAnchor } from '@/components/ui/Button'
import { PageHeader, Photo, Section } from '@/components/ui/primitives'
import LogoMark from '@/components/layout/Logo'

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
      <PageHeader eyebrow={t('about.subtitle')} title={t('about.title')} />

      {/* 소개 */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <LogoMark className="h-14 w-14 text-brand-600" />
            <h2 className="heading-md mt-7 text-white">{introTitle}</h2>
            <p className="mt-6 max-w-lg text-sm leading-relaxed text-ink-300 sm:text-base">{introDesc}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <IntroPhoto url={intro?.photo1Url} seed={1} className="aspect-[3/4] rounded-xl" />
            <div className="grid gap-3 sm:gap-4">
              <IntroPhoto url={intro?.photo2Url} seed={8} className="aspect-square rounded-xl" />
              <IntroPhoto url={intro?.photo3Url} seed={4} className="aspect-square rounded-xl" />
            </div>
          </div>
        </div>
      </Section>

      {/* 크루 */}
      {crew.length > 0 && (
        <Section className="border-t border-ink-800 bg-ink-900/30" eyebrow="CREW" title={t('about.crewTitle')}>
          <div className="grid gap-5 sm:grid-cols-3">
            {crew.map((member) => (
              <div key={member.id} className="surface overflow-hidden">
                {member.photoUrl ? (
                  <img src={member.photoUrl} alt={member.name} className="aspect-[4/5] w-full object-cover" />
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
            {videos.map((video) => (
              <a
                key={video.id}
                href={video.youtubeUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="surface surface-hover group overflow-hidden"
              >
                <div className="relative">
                  {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt={video.title} className="aspect-video w-full object-cover" />
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
            ))}
          </div>
        </Section>
      )}
    </>
  )
}

function IntroPhoto({ url, seed, className }: { url?: string | null; seed: number; className?: string }) {
  if (url) return <img src={url} alt="" className={`w-full object-cover ${className ?? ''}`} />
  return <Photo seed={seed} className={className} />
}
