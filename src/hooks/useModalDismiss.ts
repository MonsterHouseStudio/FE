import { useEffect } from 'react'

/**
 * 모달이 열려 있는 동안
 *  - ESC 로 닫히게 하고
 *  - 배경 스크롤을 잠급니다.
 * 둘 다 없으면 라이트박스 뒤에서 페이지가 계속 스크롤됩니다.
 */
export function useModalDismiss(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])
}
