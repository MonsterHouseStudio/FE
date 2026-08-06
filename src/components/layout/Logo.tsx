import { cn } from '@/lib/utils'

/** MHLogo.jpg 의 M-하우스 마크를 SVG 로 옮긴 것. 배경 없이 어디에나 얹을 수 있습니다. */
export default function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={cn('h-8 w-8', className)} aria-hidden="true">
      <path
        d="M20 82V30l14-14v34l16-16 16 16V16l14 14v52H66V52L50 68 34 52v30z"
        fill="currentColor"
      />
    </svg>
  )
}
