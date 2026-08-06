import type { Locale } from '@/i18n'

export type ProductType = 'PHOTO' | 'VIDEO' | 'INTERPRETER'

/** 통역은 /1일, /1시간 처럼 단위가 붙습니다. */
export type PriceUnit = 'PER_SESSION' | 'PER_DAY' | 'PER_HOUR'

export interface ProductOption {
  id: number
  name: string
  price: number
  /** 1 이면 체크박스, 2 이상이면 수량 선택 */
  maxQuantity: number
}

export interface Product {
  id: number
  type: ProductType
  name: string
  description: string
  durationMin: number
  price: number
  currency: string
  priceUnit: PriceUnit
  /** false 면 온라인 예약 대상이 아닙니다 (통역 → 문의 폼으로) */
  bookable: boolean
  /** "* 사진촬영 별도" 처럼 가격 옆에 붙는 단서 */
  note?: string | null
  /** 화면 표시용 — "포함 사항" 목록 */
  includes: string[]
  options?: ProductOption[]
}

export interface Slot {
  startAt: string // 'yyyy-MM-ddTHH:mm'
  endAt: string
  available: boolean
}

export interface DailySlots {
  productId: number
  date: string // 'yyyy-MM-dd'
  open: boolean
  closedReason: 'HOLIDAY' | 'CLOSED_DAY' | 'OUT_OF_RANGE' | null
  slots: Slot[]
}

export type BookingStatus = 'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED'

export interface Booking {
  bookingCode: string
  productName: string
  durationMin: number
  startAt: string
  endAt: string
  status: BookingStatus
  name: string
  maskedPhone: string
  maskedEmail: string
  memo: string | null
  basePrice: number
  options: SelectedOption[]
  totalPrice: number
  createdAt: string
}

export interface SelectedOption {
  name: string
  unitPrice: number
  quantity: number
  amount: number
}

export interface BookingCreatePayload {
  productId: number
  startAt: string
  name: string
  phone: string
  email: string
  memo?: string
  privacyAgreed: boolean
  /** 선택한 추가 옵션. 금액은 서버가 다시 계산하므로 id 와 수량만 보냅니다. */
  options?: { optionId: number; quantity: number }[]
  /** honeypot — 사람에게는 보이지 않는 필드 */
  website?: string
}

export type Country = 'KR' | 'JP'

export interface Competition {
  id: number
  country: Country
  name: string
  description: string
  startDate: string
  endDate: string
  place: string
  host: string
  link: string | null
}

/** 백엔드가 ProductType 을 갤러리 카테고리로 재사용합니다 */
export type GalleryCategory = ProductType

/**
 * 이미지 필드가 두 벌인 이유:
 *   백엔드에 붙으면 실제 URL(thumbUrl/imageUrl)이 오고,
 *   VITE_USE_MOCK=true 인 목 모드에서는 URL 이 없어 seed 로 그라디언트를 그립니다.
 *   둘 다 optional 로 두면 한쪽만 있어도 화면이 깨지지 않습니다.
 */
export interface GalleryItem {
  id: number
  category: GalleryCategory
  caption: string
  takenAt: string
  thumbUrl?: string | null
  imageUrl?: string | null
  /** 목 모드 전용 플레이스홀더 시드 */
  seed?: number
  ratio: 'portrait' | 'landscape' | 'square'
}

export interface Post {
  id: number
  slug: string
  series: string
  title: string
  excerpt: string
  /** 목록 응답에는 없습니다. 상세에서만 채워집니다. */
  body?: string
  thumbnailUrl?: string | null
  /** 목 모드 전용 플레이스홀더 시드 */
  thumbnailSeed?: number
  publishedAt: string
  viewCount: number
  /** 목 데이터에서 §3.2 폴백 정책을 흉내내기 위한 필드. 실제 API 는 서버가 걸러서 내려줍니다. */
  availableLocales?: Locale[]
}

export type InquiryType = 'INTERPRETER' | 'VIDEO'
export type InquiryStatus = 'PENDING' | 'HANDLED'

export interface Inquiry {
  id: number
  type: InquiryType
  name: string
  contact: string
  email: string
  locale: Locale
  content: string
  status: InquiryStatus
  createdAt: string
}

export interface InquiryCreatePayload {
  type: InquiryType
  name: string
  contact: string
  email: string
  content: string
  privacyAgreed: boolean
  website?: string
}

/** 백엔드 ApiResponse<T> 와 동일한 형태 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    fieldErrors?: { field: string; message: string }[]
  }
}
