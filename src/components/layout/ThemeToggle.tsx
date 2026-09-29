import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { getStoredTheme, setTheme, type Theme } from '@/lib/theme'

/** 다크 ↔ 화이트 전환 버튼. 다크일 땐 해(→라이트), 라이트일 땐 달(→다크) 아이콘. */
export default function ThemeToggle({ className }: { className?: string }) {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme())

  useEffect(() => {
    setTheme(theme)
  }, [theme])

  const toggle = () => setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
      title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full border border-ink-700 text-ink-200 transition-colors hover:border-brand-500 hover:text-brand-500',
        className,
      )}
    >
      {theme === 'dark' ? (
        // 해(라이트로)
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        // 달(다크로)
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  )
}
