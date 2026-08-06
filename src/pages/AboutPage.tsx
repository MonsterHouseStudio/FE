import { useTranslation } from 'react-i18next'
import { useLocale } from '@/hooks/useLocale'
import { CREW } from '@/mocks/data'
import { ButtonAnchor } from '@/components/ui/Button'
import { PageHeader, Photo, Section } from '@/components/ui/primitives'
import LogoMark from '@/components/layout/Logo'

const YOUTUBE = import.meta.env.VITE_YOUTUBE_CHANNEL_URL ?? 'https://www.youtube.com'

export default function AboutPage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const crew = CREW[locale]

  return (
    <>
      <PageHeader eyebrow={t('about.subtitle')} title={t('about.title')} />

      {/* 소개 */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <LogoMark className="h-14 w-14 text-brand-600" />
            <h2 className="heading-md mt-7 text-white">{t('about.introTitle')}</h2>
            <p className="mt-6 max-w-lg text-sm leading-relaxed text-ink-300 sm:text-base">
              {t('about.introDesc')}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Photo seed={1} className="aspect-[3/4] rounded-xl" />
            <div className="grid gap-3 sm:gap-4">
              <Photo seed={8} className="aspect-square rounded-xl" />
              <Photo seed={4} className="aspect-square rounded-xl" />
            </div>
          </div>
        </div>
      </Section>

      {/* 크루 */}
      <Section className="border-t border-ink-800 bg-ink-900/30" eyebrow="CREW" title={t('about.crewTitle')}>
        <div className="grid gap-5 sm:grid-cols-3">
          {crew.map((member) => (
            <div key={member.name} className="surface overflow-hidden">
              <Photo seed={member.seed} className="aspect-[4/5] w-full" />
              <div className="p-6">
                <h3 className="font-display text-lg tracking-tightest text-white">{member.name}</h3>
                <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-brand-400">
                  {member.role}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-ink-400">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 유튜브 */}
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
          {[12, 15, 18].map((seed, i) => (
            <a
              key={seed}
              href={YOUTUBE}
              target="_blank"
              rel="noreferrer noopener"
              className="surface surface-hover group overflow-hidden"
            >
              <div className="relative">
                <Photo seed={seed} className="aspect-video w-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600/90 text-white transition-transform group-hover:scale-110">
                    ▶
                  </span>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm font-semibold leading-snug text-white">
                  {locale === 'ja'
                    ? ['大会当日の朝', 'ジム紹介 EP.0' + (i + 1), '減量記録 12週'][i]
                    : ['대회 당일 아침', '센터 소개 EP.0' + (i + 1), '감량 기록 12주'][i]}
                </p>
                <p className="mt-2 text-xs text-ink-500">MONSTER HOUSE</p>
              </div>
            </a>
          ))}
        </div>
        <p className="mt-5 text-[11px] text-ink-600">
          {locale === 'ja'
            ? '※ YouTube Data API v3 連携後、実際の最新動画に置き換わります。'
            : '※ YouTube Data API v3 연동 후 실제 최신 영상으로 교체됩니다.'}
        </p>
      </Section>

      {/* 오시는 길 */}
      <Section className="border-t border-ink-800" eyebrow="LOCATION" title={t('about.locationTitle')}>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="surface relative flex min-h-[320px] items-center justify-center overflow-hidden">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }}
            />
            <div className="relative text-center">
              <LogoMark className="mx-auto h-10 w-10 text-brand-700" />
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-ink-600">
                {t('about.mapNote')}
              </p>
            </div>
          </div>

          <dl className="surface space-y-6 p-7">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.2em] text-ink-500">
                {t('about.address')}
              </dt>
              <dd className="mt-2 text-sm text-ink-100">{t('about.addressValue')}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.2em] text-ink-500">
                {t('about.hours')}
              </dt>
              <dd className="mt-2 text-sm text-ink-100">{t('about.hoursValue')}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.2em] text-ink-500">
                {t('about.contact')}
              </dt>
              <dd className="mt-2 text-sm text-ink-100">contact@monsterhouse.example</dd>
            </div>
          </dl>
        </div>
      </Section>
    </>
  )
}
