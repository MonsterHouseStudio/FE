import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from '@/hooks/useLocale'
import { cn } from '@/lib/utils'
import type { HomeStat } from '@/types'

const reduceMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** 대상 숫자까지 easeOutCubic 으로 카운트업. active 가 true 가 될 때 시작. */
function useCountUp(target: number, active: boolean, duration = 1500) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active) return
    if (reduceMotion()) {
      setValue(target)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, target, duration])
  return value
}

/**
 * 한 통계 콘텐츠(스크롤 진행도에 따라 크로스페이드).
 * 왼쪽 = 인덱스·라벨·설명(좌측 정렬), 오른쪽 = 거대한 숫자(전체적으로 강조).
 */
function StatContent({
  stat,
  index,
  total,
  active,
  innerRef,
}: {
  stat: HomeStat
  index: number
  total: number
  active: boolean
  innerRef: (el: HTMLDivElement | null) => void
}) {
  const isNumeric = stat.valueNumber != null
  const count = useCountUp(stat.valueNumber ?? 0, active && isNumeric)
  const bigValue = isNumeric ? `${count.toLocaleString()}${stat.suffix ?? ''}` : stat.valueText

  return (
    <div
      ref={innerRef}
      className="absolute inset-0 flex items-center will-change-[opacity,transform]"
      style={{ opacity: 0 }}
    >
      {/* 좌측 정렬 한 열: 문구(인덱스·라벨·설명) → 그 아래 숫자 (제목과 같은 왼쪽 라인) */}
      <div className="container-mh">
       <div className="max-w-2xl text-left">
        <div className="font-poster text-sm tracking-[0.4em] text-brand-400">
          {String(index + 1).padStart(2, '0')}{' '}
          <span className="text-ink-600">/ {String(total).padStart(2, '0')}</span>
        </div>
        {stat.label && (
          <div className="mt-5 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {stat.label}
          </div>
        )}
        {stat.description && (
          <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-300 sm:text-base">
            {stat.description}
          </p>
        )}

        {/* 숫자 (문구 아래, 크기 축소) */}
        <span
          className={cn(
            'mt-6 block whitespace-nowrap font-display font-black leading-[0.85] tracking-tightest text-white',
            isNumeric
              ? 'text-[16vw] sm:text-[13vw] lg:text-[120px]'
              : 'text-[10vw] sm:text-[8vw] lg:text-[72px]',
          )}
        >
          {bigValue}
        </span>
       </div>
      </div>
    </div>
  )
}

/** 스크롤에 고정(pin)되는 풀스크린 통계 섹션. 스크롤 진행도가 활성 통계를 바꾼다. */
function ScrollStats({ stats, title }: { stats: HomeStat[]; title: string }) {
  const wrapRef = useRef<HTMLElement>(null)
  const contentRefs = useRef<(HTMLDivElement | null)[]>([])
  const photoRefs = useRef<(HTMLDivElement | null)[]>([])
  // 카운트업 트리거용 — 한 번이라도 활성이 된 통계는 계속 활성으로 간주
  const [seen, setSeen] = useState<boolean[]>(() => stats.map(() => false))
  const seenRef = useRef(seen)
  seenRef.current = seen

  const N = stats.length

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    // 모션 최소화: 첫 번째만 보이게 고정하고 카운트업 즉시 완료
    if (reduceMotion()) {
      contentRefs.current.forEach((el, i) => {
        if (el) el.style.opacity = i === 0 ? '1' : '0'
      })
      setSeen(stats.map(() => true))
      return
    }

    let raf = 0
    const update = () => {
      raf = 0
      const rect = wrap.getBoundingClientRect()
      const vh = window.innerHeight || 1
      const scrollable = wrap.offsetHeight - vh
      // 섹션이 화면에 고정되는 구간의 진행도 0..1
      const progress = Math.max(0, Math.min(1, -rect.top / (scrollable || 1)))
      const activeFloat = progress * N // 0..N

      const nextSeen = seenRef.current.slice()
      let changed = false

      for (let i = 0; i < N; i++) {
        // 각 통계의 구간 중앙에서의 거리(구간 단위)
        const dist = activeFloat - (i + 0.5)
        const opacity = Math.max(0, 1 - Math.abs(dist) * 1.7)
        const content = contentRefs.current[i]
        if (content) {
          content.style.opacity = String(opacity)
          content.style.transform = `translateY(${dist * 44}px)`
          content.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none'
        }
        const photo = photoRefs.current[i]
        if (photo) {
          photo.style.opacity = String(Math.max(0, 1 - Math.abs(dist) * 1.35))
          photo.style.transform = `translateY(${dist * -26}px) scale(1.12)`
        }
        if (Math.abs(dist) < 0.55 && !nextSeen[i]) {
          nextSeen[i] = true
          changed = true
        }
      }
      if (changed) setSeen(nextSeen)
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [N])

  return (
    <section
      ref={wrapRef}
      className="relative bg-ink-950"
      style={{ height: `${N * 100}vh` }}
      aria-label={title}
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        {/* 배경 사진들(크로스페이드 + 패럴랙스) */}
        <div className="absolute inset-0">
          {stats.map((stat, i) => (
            <div
              key={`bg-${stat.id}`}
              ref={(el) => (photoRefs.current[i] = el)}
              className="absolute inset-0 will-change-[opacity,transform]"
              style={{ opacity: i === 0 ? 1 : 0 }}
            >
              {stat.photoUrl ? (
                <img src={stat.photoUrl} alt="" aria-hidden className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-brand-950 via-ink-950 to-black" />
              )}
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/85" />
        </div>

        {/* 상단 고정 라벨 */}
        <div className="container-mh absolute inset-x-0 top-8 sm:top-12">
          <p className="eyebrow">BY THE NUMBERS</p>
          <h2 className="heading-md mt-3 text-white">{title}</h2>
        </div>

        {/* 통계 콘텐츠들(크로스페이드) */}
        {stats.map((stat, i) => (
          <StatContent
            key={stat.id}
            stat={stat}
            index={i}
            total={N}
            active={seen[i]}
            innerRef={(el) => (contentRefs.current[i] = el)}
          />
        ))}
      </div>
    </section>
  )
}

/** 홈 "숫자로 보는" — 스크롤에 고정되는 풀스크린 통계. 관리자에서 값·사진 편집. */
export default function HomeStats() {
  const locale = useLocale()
  const { data } = useQuery({
    queryKey: ['home-stats', locale],
    queryFn: () => api.getHomeStats(locale),
  })

  const stats = data ?? []
  if (stats.length === 0) return null

  const title = locale === 'ja' ? '数字で見る MONSTER HOUSE' : '숫자로 보는 MONSTER HOUSE'
  return <ScrollStats stats={stats} title={title} />
}
