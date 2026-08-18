import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalePath } from '@/hooks/useLocale'
import { ButtonLink } from '@/components/ui/Button'
import LogoMark from '@/components/layout/Logo'
import { cn } from '@/lib/utils'
import type { Banner } from '@/types'

/** 자동 넘김 간격 */
const AUTO_ADVANCE_MS = 8000

/**
 * 홈 첫 화면 배너.
 *
 * - 배너가 여러 장이면 옆으로 넘길 수 있습니다(스와이프 / 화살표 / 점).
 * - 한 장이 화면을 꽉 채웁니다. 헤더가 상단에서 투명하므로 그 뒤까지 깔립니다.
 * - 배너가 하나도 없으면 기존 그라디언트 히어로로 돌아갑니다.
 *
 * 캐러셀 라이브러리를 쓰지 않고 CSS scroll-snap 으로 만들었습니다.
 * 모바일 스와이프·트랙패드 관성·접근성이 전부 브라우저 기본 동작으로 따라오고,
 * 배너 하나 넘기자고 번들에 수십 KB 를 얹을 이유가 없습니다.
 */
export default function HeroCarousel({ banners }: { banners: Banner[] }) {
  const { t } = useTranslation()
  const lp = useLocalePath()

  // 배너가 없으면 null 한 장 = 기본 히어로. 아래 렌더 분기가 단순해집니다.
  const slides: (Banner | null)[] = banners.length > 0 ? banners : [null]
  const count = slides.length

  const trackRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  /** 버튼으로 이동 중인 목표 인덱스. 이동이 끝나기 전 중간값을 걸러냅니다. */
  const pendingRef = useRef<number | null>(null)
  const pendingTimer = useRef(0)

  const [index, setIndex] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [tabHidden, setTabHidden] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  /* ---------- 모션 최소화 설정 ---------- */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduceMotion(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  /* ---------- 탭이 안 보이면 자동 넘김 중단 ---------- */
  useEffect(() => {
    const sync = () => setTabHidden(document.hidden)
    // 마운트 시점 동기화가 없으면, 백그라운드 탭에서 열린 페이지가
    // visibilitychange 가 한 번도 안 오는 동안 계속 배너를 넘기고 영상을 재생합니다.
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  /* ---------- 스크롤 위치 -> 현재 인덱스 ---------- */
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    let raf = 0
    const onScroll = () => {
      // 스크롤 이벤트는 초당 수십 번 옵니다. 프레임당 한 번으로 줄입니다.
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const w = track.clientWidth
        if (w === 0) return
        const next = Math.min(Math.max(Math.round(track.scrollLeft / w), 0), count - 1)

        // 버튼으로 이동하는 중이면 목표에 닿기 전까지는 무시합니다.
        // 안 그러면 0 -> 2 로 넘길 때 점이 0, 1, 2 로 튀고 영상이 켜졌다 꺼집니다.
        const pending = pendingRef.current
        if (pending !== null) {
          if (next !== pending) return
          pendingRef.current = null
          window.clearTimeout(pendingTimer.current)
        }

        setIndex((prev) => (next === prev ? prev : next))
      })
    }

    track.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      track.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [count])

  /* ---------- 배너 목록이 바뀌면(언어 전환 등) 처음으로 ---------- */
  useEffect(() => {
    slideRefs.current.length = count
    videoRefs.current.length = count
    setIndex(0)
    pendingRef.current = null
    trackRef.current?.scrollTo({ left: 0, behavior: 'instant' })
  }, [count, banners])

  /* ---------- 타이머 정리 ---------- */
  useEffect(() => () => window.clearTimeout(pendingTimer.current), [])

  /**
   * 지정한 배너로 이동합니다.
   *
   * behavior 를 'auto' 로 두면 안 됩니다 — 전역 CSS 에 `html { scroll-behavior: smooth }`
   * 가 걸려 있어서 'auto' 는 부드러운 스크롤로 해석됩니다. 즉시 이동은 'instant' 여야 합니다.
   */
  const goTo = useCallback(
    (raw: number, smooth = true) => {
      const track = trackRef.current
      if (!track) return
      const target = ((raw % count) + count) % count
      // 스크롤이 끝나기를 기다리지 않고 먼저 반영합니다.
      // 부드러운 스크롤은 수백 ms 걸리는데, 그동안 점이 안 움직이면 눌러도 안 먹는 것처럼 보입니다.
      setIndex(target)
      pendingRef.current = target
      // 사용자가 이동 중에 손으로 쓸어버리면 목표에 영영 안 닿습니다. 그때를 위한 해제 장치입니다.
      window.clearTimeout(pendingTimer.current)
      pendingTimer.current = window.setTimeout(() => {
        pendingRef.current = null
      }, 1000)
      track.scrollTo({
        left: target * track.clientWidth,
        behavior: smooth && !reduceMotion ? 'smooth' : 'instant',
      })
    },
    [count, reduceMotion],
  )

  /* ---------- 자동 넘김 ---------- */
  useEffect(() => {
    if (count < 2 || hovered || tabHidden || reduceMotion) return
    const id = window.setTimeout(() => {
      // 마지막 -> 첫 장은 전체를 되감는 모양이 되므로 부드럽게 하지 않습니다.
      goTo(index + 1, index < count - 1)
    }, AUTO_ADVANCE_MS)
    return () => window.clearTimeout(id)
  }, [index, count, hovered, tabHidden, reduceMotion, goTo])

  /* ---------- 보이는 배너만 재생 / 나머지는 조작 대상에서 제외 ---------- */
  useEffect(() => {
    slideRefs.current.forEach((el, i) => {
      // inert 가 없으면 화면 밖 배너의 버튼에 Tab 으로 들어가지고,
      // 그 순간 트랙이 옆으로 튀어서 사용자가 길을 잃습니다.
      el?.toggleAttribute('inert', i !== index)
    })
    videoRefs.current.forEach((video, i) => {
      if (!video) return
      if (i === index) {
        // 자동재생이 막힌 환경에서는 거부됩니다. poster 가 대신 보이므로 무시합니다.
        void video.play().catch(() => {})
      } else {
        video.pause()
      }
    })
  }, [index, count])

  return (
    <section
      // main 의 pt-16/pt-20 을 되돌려 헤더 뒤까지 화면을 꽉 채웁니다.
      className="relative -mt-16 sm:-mt-20"
      aria-roledescription="carousel"
      aria-label={t('home.heroCarousel')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
    >
      <div
        ref={trackRef}
        className={cn(
          'no-scrollbar flex overflow-x-auto overscroll-x-contain',
          // 배너가 한 장뿐이면 스냅도 스크롤도 필요 없습니다.
          count > 1 && 'snap-x snap-mandatory',
        )}
      >
        {slides.map((banner, i) => (
          <div
            key={banner?.id ?? 'default'}
            ref={(el) => {
              slideRefs.current[i] = el
            }}
            role="group"
            aria-roledescription="slide"
            aria-label={t('home.heroSlideOf', { n: i + 1, total: count })}
            className="hero-screen relative flex w-full shrink-0 basis-full snap-center snap-always items-center overflow-hidden"
          >
            {banner ? (
              <>
                {banner.mediaType === 'VIDEO' ? (
                  /*
                   * muted + playsInline + autoPlay 세 개가 모두 있어야 자동재생됩니다.
                   * 하나라도 빠지면 모바일에서 재생되지 않습니다(특히 iOS).
                   * poster 는 재생 전·실패 시 대체 화면입니다 — 서버가 필수로 강제합니다.
                   */
                  <video
                    ref={(el) => {
                      videoRefs.current[i] = el
                    }}
                    src={banner.mediaUrl}
                    poster={banner.posterUrl ?? undefined}
                    muted
                    loop
                    autoPlay
                    playsInline
                    // 첫 장만 미리 받습니다. 배너 다섯 장을 한꺼번에 받으면 첫 화면이 늦습니다.
                    preload={i === 0 ? 'auto' : 'metadata'}
                    // 배경 장식이라 스크린리더가 읽을 필요가 없습니다.
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={banner.mediaUrl}
                    alt=""
                    aria-hidden="true"
                    loading={i === 0 ? 'eager' : 'lazy'}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                {/*
                 * 어두운 덮개가 없으면 밝은 영상 위에서 흰 글씨가 안 읽힙니다.
                 * 사장님이 어떤 영상을 올릴지 모르므로 항상 깔아둡니다.
                 */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/60 to-black/80" />
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-ink-950 to-black" />
                <div className="absolute -right-24 top-1/2 -translate-y-1/2 text-brand-900/40">
                  <LogoMark className="h-[520px] w-[520px]" />
                </div>
                <div
                  className="absolute inset-0 opacity-[0.05]"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(120deg, #fff 0 1px, transparent 1px 14px)',
                  }}
                />
              </>
            )}

            {/* pt 는 헤더 높이 — 글이 헤더 밑에 깔리지 않게, pb 는 점·스크롤 표시 자리 */}
            <div className="container-mh relative w-full pb-32 pt-16 sm:pt-20">
              <p className="eyebrow">{t('home.heroEyebrow')}</p>
              <h1 className="heading-xl mt-6 max-w-3xl whitespace-pre-line text-white">
                {banner?.headline || t('home.heroTitle')}
              </h1>
              <p className="mt-7 max-w-xl text-sm leading-relaxed text-ink-300 sm:text-base">
                {banner?.subtext || t('home.heroDesc')}
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <ButtonLink to={lp('/shooting/booking')} size="lg">
                  {t('home.heroCta')}
                </ButtonLink>
                <ButtonLink to={lp('/shooting')} variant="outline" size="lg">
                  {t('home.heroCtaSub')}
                </ButtonLink>
              </div>
            </div>
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          {/* 좌우 화살표 — 모바일은 스와이프로 넘기므로 넓은 화면에서만 */}
          <ArrowButton side="left" label={t('home.heroPrev')} onClick={() => goTo(index - 1)} />
          <ArrowButton side="right" label={t('home.heroNext')} onClick={() => goTo(index + 1)} />

          {/* 점 표시 */}
          <div className="absolute inset-x-0 bottom-10 z-10 flex justify-center gap-2.5">
            {slides.map((banner, i) => (
              <button
                key={banner?.id ?? i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={t('home.heroGoTo', { n: i + 1 })}
                aria-current={i === index}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  i === index
                    ? 'w-8 bg-brand-500'
                    : 'w-2 bg-white/40 hover:bg-white/70',
                )}
              />
            ))}
          </div>
        </>
      )}

      {/*
       * 화면을 꽉 채우면 아래에 내용이 더 있다는 신호가 사라집니다.
       * 스크롤 안내를 남겨둡니다.
       */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-x-0 z-10 flex justify-center',
          count > 1 ? 'bottom-3' : 'bottom-8',
        )}
      >
        <span className="animate-bounce text-lg leading-none text-white/50">↓</span>
        <span className="sr-only">{t('home.heroScroll')}</span>
      </div>
    </section>
  )
}

function ArrowButton({
  side,
  label,
  onClick,
}: {
  side: 'left' | 'right'
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center',
        'rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-sm',
        'transition-colors hover:border-brand-500 hover:bg-brand-600 lg:flex',
        side === 'left' ? 'left-5' : 'right-5',
      )}
    >
      {side === 'left' ? '‹' : '›'}
    </button>
  )
}
