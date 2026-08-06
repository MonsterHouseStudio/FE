import { useState, type ReactNode } from 'react'
import { cn, seedGradient } from '@/lib/utils'

// ===== 페이지 상단 헤더 =====
export function PageHeader({
  eyebrow,
  title,
  desc,
  children,
}: {
  eyebrow: string
  title: string
  desc?: string
  children?: ReactNode
}) {
  return (
    <header className="border-b border-ink-800 bg-gradient-to-b from-ink-900 to-ink-950">
      <div className="container-mh py-16 sm:py-24">
        <p className="eyebrow animate-fade-in">{eyebrow}</p>
        <h1 className="heading-lg mt-4 text-white animate-fade-up">{title}</h1>
        {desc && (
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink-300 sm:text-base animate-fade-up">
            {desc}
          </p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </header>
  )
}

// ===== 섹션 =====
export function Section({
  eyebrow,
  title,
  desc,
  action,
  children,
  className,
}: {
  eyebrow?: string
  title?: string
  desc?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('py-16 sm:py-24', className)}>
      <div className="container-mh">
        {(eyebrow || title) && (
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              {eyebrow && <p className="eyebrow">{eyebrow}</p>}
              {title && <h2 className="heading-md mt-3 whitespace-pre-line text-white">{title}</h2>}
              {desc && <p className="mt-4 max-w-xl text-sm text-ink-300">{desc}</p>}
            </div>
            {action}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}

// ===== 배지 =====
const BADGE_TONES = {
  brand: 'bg-brand-600/15 text-brand-300 border-brand-600/40',
  neutral: 'bg-ink-800 text-ink-300 border-ink-700',
  success: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  warning: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  danger: 'bg-red-500/10 text-red-300 border-red-500/30',
} as const

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: keyof typeof BADGE_TONES
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider',
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

// ===== 로딩 =====
export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-6 w-6 animate-spin rounded-full border-2 border-ink-700 border-t-brand-500',
        className,
      )}
      role="status"
      aria-label="loading"
    />
  )
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-ink-400">
      <Spinner />
      <p className="text-xs uppercase tracking-[0.2em]">{label}</p>
    </div>
  )
}

export function EmptyBlock({ label }: { label: string }) {
  return (
    <div className="surface flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="text-3xl opacity-30">—</div>
      <p className="text-sm text-ink-400">{label}</p>
    </div>
  )
}

// ===== 사진 =====
/**
 * src 가 있으면 실제 이미지를, 없으면 시드 기반 그라디언트 자리표시를 그립니다.
 *
 * 자리표시를 남겨둔 이유:
 *   상품·크루·소개 페이지처럼 아직 실제 사진이 없는 곳이 많고,
 *   목 모드(VITE_USE_MOCK=true)에서도 화면이 비어 보이지 않아야 합니다.
 *
 * 이미지 로딩에 실패하면(키가 지워졌거나 CDN 장애) 자리표시로 되돌아갑니다.
 * 깨진 이미지 아이콘이 그대로 노출되는 것보다 낫습니다.
 */
export function Photo({
  src,
  seed = 0,
  alt = '',
  className,
  label,
}: {
  src?: string | null
  seed?: number
  alt?: string
  className?: string
  label?: string
}) {
  const [failed, setFailed] = useState(false)
  const showImage = !!src && !failed

  return (
    <div
      className={cn('photo-ph flex items-center justify-center', className)}
      style={showImage ? undefined : { background: seedGradient(seed) }}
    >
      {showImage ? (
        <img
          src={src!}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <svg viewBox="0 0 100 100" className="h-1/4 w-1/4 opacity-[0.13]" aria-hidden="true">
          <path
            d="M20 82V30l14-14v34l16-16 16 16V16l14 14v52H66V52L50 68 34 52v30z"
            fill="#fff"
          />
        </svg>
      )}
      {label && (
        <span className="absolute bottom-3 left-3 right-3 truncate text-[11px] text-white/70">
          {label}
        </span>
      )}
    </div>
  )
}
