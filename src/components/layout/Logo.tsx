import { cn } from '@/lib/utils'

/**
 * MONSTER HOUSE 엠블럼(M-하우스 마크). 흰색/투명 PNG 라 다크 배경 어디에나 얹힙니다.
 * 사이즈는 className 의 h/w 로 지정(정사각 박스에 object-contain 로 중앙 정렬).
 */
export default function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/mh-logo-mark.png"
      alt=""
      aria-hidden="true"
      className={cn('h-8 w-8 object-contain', className)}
    />
  )
}
