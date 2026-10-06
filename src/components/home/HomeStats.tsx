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

function StatCell({ stat, index, active }: { stat: HomeStat; index: number; active: boolean }) {
  const isNumeric = stat.valueNumber != null
  const count = useCountUp(stat.valueNumber ?? 0, active && isNumeric)
  const bigValue = isNumeric ? `${count.toLocaleString()}${stat.suffix ?? ''}` : stat.valueText

  return (
    <div className="border-b border-r border-ink-800 p-7 sm:p-8 lg:p-9">
      <div className="font-poster text-xs tracking-[0.3em] text-brand-500">
        {String(index + 1).padStart(2, '0')}
      </div>
      <div className="mt-5 font-display text-5xl font-black leading-none tracking-tightest text-ink-50 sm:text-6xl">
        {bigValue}
      </div>
      {stat.label && (
        <h3 className="mt-4 font-display text-lg tracking-tight text-ink-100">{stat.label}</h3>
      )}
      {stat.description && (
        <p className="mt-2 text-sm leading-relaxed text-ink-400">{stat.description}</p>
      )}
    </div>
  )
}

/** 홈 "숫자로 보는" — 얇은 구분선 카드 그리드. 스크롤 진입 시 카운트업. 관리자에서 값 편집. */
export default function HomeStats() {
  const locale = useLocale()
  const { data } = useQuery({
    queryKey: ['home-stats', locale],
    queryFn: () => api.getHomeStats(locale),
  })

  const gridRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    if (reduceMotion()) {
      setActive(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActive(true)
            io.disconnect()
          }
        }
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [data])

  const stats = data ?? []
  if (stats.length === 0) return null

  const title = locale === 'ja' ? '数字で見る MONSTER HOUSE' : '숫자로 보는 MONSTER HOUSE'
  const cols =
    stats.length >= 4 ? 'lg:grid-cols-4' : stats.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'

  return (
    <section className="border-t border-ink-800 py-16 sm:py-24">
      <div className="container-mh">
        <p className="eyebrow">BY THE NUMBERS</p>
        <h2 className="heading-md mt-4 text-ink-50">{title}</h2>

        <div
          ref={gridRef}
          className={cn('mt-10 grid grid-cols-1 border-l border-t border-ink-800 sm:grid-cols-2', cols)}
        >
          {stats.map((stat, i) => (
            <StatCell key={stat.id} stat={stat} index={i} active={active} />
          ))}
        </div>
      </div>
    </section>
  )
}
