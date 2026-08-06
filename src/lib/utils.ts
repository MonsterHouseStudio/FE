import clsx, { type ClassValue } from 'clsx'
import type { Locale } from '@/i18n'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// ===== 날짜 =====
// 한국/일본 모두 UTC+9 라 시각 변환은 불필요하지만 표기 형식이 다릅니다 (기획서 §3.3)

export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDate(input: string | Date, locale: Locale): string {
  const date = typeof input === 'string' ? new Date(input) : input
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
  const weekdayJa = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]

  if (locale === 'ja') {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日(${weekdayJa})`
  }
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일(${weekday})`
}

export function formatDateShort(input: string | Date, locale: Locale): string {
  const date = typeof input === 'string' ? new Date(input) : input
  if (locale === 'ja') {
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}

export function formatTime(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function formatDateTime(input: string, locale: Locale): string {
  return `${formatDate(input, locale)} ${formatTime(input)}`
}

export function formatPrice(price: number, locale: Locale): string {
  const formatted = price.toLocaleString(locale === 'ja' ? 'ja-JP' : 'ko-KR')
  return locale === 'ja' ? `${formatted}ウォン` : `${formatted}원`
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

/** 목 데이터의 사진 자리를 채우는 결정적 그라디언트 */
export function seedGradient(seed: number): string {
  const hues = [0, 355, 8, 350, 12, 345]
  const h1 = hues[seed % hues.length]
  const h2 = hues[(seed + 2) % hues.length]
  const l1 = 14 + ((seed * 7) % 12)
  const l2 = 5 + ((seed * 3) % 8)
  return `linear-gradient(145deg, hsl(${h1} 55% ${l1}%), hsl(${h2} 40% ${l2}%))`
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
