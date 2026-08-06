import type { BookingStatus } from '@/types'

export interface AdminBookingRow {
  id: number
  bookingCode: string
  productName: string
  price: number
  startAt: string
  endAt: string
  status: BookingStatus
  name: string
  phone: string
  email: string
  locale: 'ko' | 'ja'
  memo: string | null
  createdAt: string
}

function shift(days: number, time: string): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}T${time}`
}

function addMin(iso: string, min: number): string {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() + min)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${dd}T${hh}:${mm}`
}

const RAW: Omit<AdminBookingRow, 'endAt' | 'price'>[] = [
  {
    id: 1,
    bookingCode: 'MH-20260804-7K2Q',
    productName: '바디프로필',
    startAt: shift(0, '14:00'),
    status: 'CONFIRMED',
    name: '김도윤',
    phone: '010-2233-4455',
    email: 'doyun@example.com',
    locale: 'ko',
    memo: '흑백 컨셉 위주로 부탁드립니다.',
    createdAt: shift(-4, '10:22'),
  },
  {
    id: 2,
    bookingCode: 'MH-20260804-M9XD',
    productName: '모티베이션 영상',
    startAt: shift(0, '17:00'),
    status: 'CONFIRMED',
    name: '박서준',
    phone: '010-7788-1122',
    email: 'seojun@example.com',
    locale: 'ko',
    memo: null,
    createdAt: shift(-3, '19:41'),
  },
  {
    id: 3,
    bookingCode: 'MH-20260805-QT4B',
    productName: 'ボディプロフィール',
    startAt: shift(1, '11:00'),
    status: 'REQUESTED',
    name: '中村 亮',
    phone: '+81-90-1234-5678',
    email: 'nakamura@example.jp',
    locale: 'ja',
    memo: '大会2週間前の撮影です。',
    createdAt: shift(-1, '08:15'),
  },
  {
    id: 4,
    bookingCode: 'MH-20260806-L3HP',
    productName: '센터 홍보',
    startAt: shift(2, '10:00'),
    status: 'REQUESTED',
    name: '이지훈',
    phone: '010-5566-7788',
    email: 'jihoon@example.com',
    locale: 'ko',
    memo: '2층 전체 촬영 가능한지 확인 부탁드립니다.',
    createdAt: shift(-1, '13:07'),
  },
  {
    id: 5,
    bookingCode: 'MH-20260808-V8ZR',
    productName: '바디프로필',
    startAt: shift(4, '15:30'),
    status: 'REQUESTED',
    name: '최유나',
    phone: '010-9911-2233',
    email: 'yuna@example.com',
    locale: 'ko',
    memo: null,
    createdAt: shift(0, '09:03'),
  },
  {
    id: 6,
    bookingCode: 'MH-20260731-C6WN',
    productName: '모티베이션 영상',
    startAt: shift(-4, '13:00'),
    status: 'COMPLETED',
    name: '정민석',
    phone: '010-3344-5566',
    email: 'minseok@example.com',
    locale: 'ko',
    memo: null,
    createdAt: shift(-12, '21:30'),
  },
  {
    id: 7,
    bookingCode: 'MH-20260729-B2FK',
    productName: 'モチベーション映像',
    startAt: shift(-6, '16:00'),
    status: 'CANCELED',
    name: '小林 花',
    phone: '+81-80-9876-5432',
    email: 'kobayashi@example.jp',
    locale: 'ja',
    memo: '日程変更のためキャンセル',
    createdAt: shift(-15, '11:12'),
  },
]

/** 상품명 → (소요시간, 가격). 실제 연동 시에는 API 응답에 함께 내려옵니다. */
const PRODUCT_META: Record<string, { durationMin: number; price: number }> = {
  바디프로필: { durationMin: 90, price: 300_000 },
  ボディプロフィール: { durationMin: 90, price: 300_000 },
  '모티베이션 영상': { durationMin: 60, price: 200_000 },
  モチベーション映像: { durationMin: 60, price: 200_000 },
  '센터 홍보': { durationMin: 120, price: 500_000 },
}

const FALLBACK_META = { durationMin: 60, price: 200_000 }

export const ADMIN_BOOKINGS: AdminBookingRow[] = RAW.map((row) => {
  const meta = PRODUCT_META[row.productName] ?? FALLBACK_META
  return {
    ...row,
    price: meta.price,
    endAt: addMin(row.startAt, meta.durationMin + 15),
  }
})
