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
function useCountUp(target: number, active: boolean, duration = 1600) {
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

function StatPanel({ stat, index, total }: { stat: HomeStat; index: number; total: number }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLImageElement>(null)
  const [entered, setEntered] = useState(false)

  const isNumeric = stat.valueNumber != null
  const count = useCountUp(stat.valueNumber ?? 0, entered && isNumeric)
  const bigValue = isNumeric ? `${count.toLocaleString()}${stat.suffix ?? ''}` : stat.valueText

  // 스크롤에 연동해 패럴랙스 + 문구 페이드/슬라이드. rAF 로 throttle.
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    if (reduceMotion()) {
      setEntered(true)
      return
    }
    let raf = 0
    const update = () => {
      raf = 0
      const rect = panel.getBoundingClientRect()
      const vh = window.innerHeight || 1
      // 패널 중앙이 화면 중앙에 오면 0, 위/아래로 갈수록 ±1
      const progress = Math.max(-1, Math.min(1, (rect.top + rect.height / 2 - vh / 2) / vh))
      const abs = Math.abs(progress)

      if (contentRef.current) {
        const op = Math.max(0, 1 - abs * 1.35)
        contentRef.current.style.opacity = String(op)
        contentRef.current.style.transform = `translateY(${progress * -46}px)`
      }
      if (photoRef.current) {
        // 사진은 스크롤 반대로 천천히 → 깊이감(패럴랙스)
        photoRef.current.style.transform = `translateY(${progress * 64}px) scale(1.18)`
      }
      // 화면 중앙 근처(45% 이내)에 들어오면 카운트업 시작
      if (!entered && abs < 0.45) setEntered(true)
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
  }, [entered])

  return (
    <div
      ref={panelRef}
      className="relative flex min-h-[90vh] w-full items-center justify-center overflow-hidden"
    >
      {/* 배경: 사진(패럴랙스) + 어두운 덮개, 없으면 브랜드 그라디언트 */}
      {stat.photoUrl ? (
        <>
          <img
            ref={photoRef}
            src={stat.photoUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover will-change-transform"
            style={{ transform: 'scale(1.18)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/85" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-ink-950 to-black" />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(120deg, #fff 0 1px, transparent 1px 16px)',
            }}
          />
        </>
      )}

      {/* 내용 (스크롤에 연동해 페이드/슬라이드) */}
      <div ref={contentRef} className="container-mh relative text-center will-change-transform">
        <div className="font-poster text-sm tracking-[0.4em] text-brand-400">
          {String(index + 1).padStart(2, '0')}{' '}
          <span className="text-ink-600">/ {String(total).padStart(2, '0')}</span>
        </div>

        <div
          className={cn(
            'mt-6 font-display font-black leading-none tracking-tightest text-white',
            'text-[19vw] sm:text-[13vw] lg:text-[150px]',
          )}
        >
          {bigValue}
        </div>

        {stat.label && (
          <div className="mt-2 font-display text-xl tracking-tight text-white sm:text-2xl">
            {stat.label}
          </div>
        )}

        {stat.description && (
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-ink-300 sm:text-base">
            {stat.description}
          </p>
        )}
      </div>
    </div>
  )
}

/** 홈 "숫자로 보는" — 스크롤에 연동되는 풀스크린 통계 패널. 관리자에서 값·사진 편집. */
export default function HomeStats() {
  const locale = useLocale()
  const { data } = useQuery({
    queryKey: ['home-stats', locale],
    queryFn: () => api.getHomeStats(locale),
  })

  const stats = data ?? []
  if (stats.length === 0) return null

  return (
    <section className="border-y border-ink-800 bg-ink-950">
      <div className="container-mh pt-16 text-center sm:pt-20">
        <p className="eyebrow">BY THE NUMBERS</p>
        <h2 className="heading-lg mt-4 text-white">
          {locale === 'ja' ? '数字で見る MONSTER HOUSE' : '숫자로 보는 MONSTER HOUSE'}
        </h2>
      </div>
      {stats.map((stat, i) => (
        <StatPanel key={stat.id} stat={stat} index={i} total={stats.length} />
      ))}
    </section>
  )
}
