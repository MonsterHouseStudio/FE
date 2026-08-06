import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'outline' | 'ghost' | 'dark'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-500 border border-brand-600 hover:border-brand-500',
  outline: 'bg-transparent text-ink-100 border border-ink-600 hover:border-brand-500 hover:text-white',
  ghost: 'bg-transparent text-ink-300 border border-transparent hover:text-white hover:bg-ink-800',
  dark: 'bg-ink-100 text-ink-950 border border-ink-100 hover:bg-white',
}

const SIZES: Record<Size, string> = {
  sm: 'px-3.5 py-2 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-sm sm:text-base',
}

interface BaseProps {
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-bold uppercase tracking-wider transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40'

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: BaseProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(base, VARIANTS[variant], SIZES[size], className)} {...props}>
      {children}
    </button>
  )
}

export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  className,
  children,
}: BaseProps & { to: string }) {
  return (
    <Link to={to} className={cn(base, VARIANTS[variant], SIZES[size], className)}>
      {children}
    </Link>
  )
}

export function ButtonAnchor({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
}: BaseProps & { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(base, VARIANTS[variant], SIZES[size], className)}
    >
      {children}
    </a>
  )
}
