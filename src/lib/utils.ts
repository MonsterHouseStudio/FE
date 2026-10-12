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

/**
 * 한국 전화번호 자동 하이픈 포맷 + 자릿수 제한(최대 11자리).
 * 입력 중 숫자만 추려 010-4483-3231 처럼 보기 좋게 만듭니다.
 * 서울 지역번호(02)와 휴대폰/일반(0XX) 모두 처리.
 */
export function formatKoreanPhone(input: string): string {
  const d = input.replace(/\D/g, '').slice(0, 11)
  if (d.startsWith('02')) {
    if (d.length <= 2) return d
    if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`
    if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`
  }
  if (d.length <= 3) return d
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`
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
