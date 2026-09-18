import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useLocale } from '@/hooks/useLocale'
import { cn } from '@/lib/utils'
import type { HomeStat } from '@/types'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** 대상 숫자까지 easeOutCubic 으로 카운트업. active 가 true 가 될 때 시작. */
function useCountUp(target: number, active: boolean, duration = 1500) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active) return
    if (prefersReducedMotion()) {
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
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ob = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true)
          ob.disconnect()
        }
      },
      { threshold: 0.45 },
    )
    ob.observe(el)
    return () => ob.disconnect()
  }, [])

  const isNumeric = stat.valueNumber != null
  const count = useCountUp(stat.valueNumber ?? 0, inView && isNumeric)
  const bigValue = isNumeric ? `${count.toLocaleString()}${stat.suffix ?? ''}` : stat.valueText

  return (
    <div
      ref={ref}
      className="relative flex min-h-[82vh] w-full items-center justify-center overflow-hidden"
    >
      {/* 배경: 사진이 있으면 사진 + 어두운 덮개, 없으면 브랜드 그라디언트 */}
      {stat.photoUrl ? (
        <>
          <img
            src={stat.photoUrl}
            alt=""
            aria-hidden="true"
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-transform duration-[1600ms] ease-out',
              inView ? 'scale-100' : 'scale-110',
            )}
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

      {/* 내용 */}
      <div
        className={cn(
          'container-mh relative text-center transition-all duration-700 ease-out',
          inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
        )}
      >
        <div className="font-poster text-sm tracking-[0.4em] text-brand-400">
          {String(index + 1).padStart(2, '0')} <span className="text-ink-600">/ {String(total).padStart(2, '0')}</span>
        </div>

        <div className="mt-6 font-display font-black leading-none tracking-tightest text-white text-[19vw] sm:text-[13vw] lg:text-[150px]">
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

/** 홈 "숫자로 보는" — 스크롤하면 화면을 채우는 통계 패널. 관리자에서 값·사진 편집. */
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
        <p className="eyebrow">{locale === 'ja' ? 'BY THE NUMBERS' : 'BY THE NUMBERS'}</p>
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
