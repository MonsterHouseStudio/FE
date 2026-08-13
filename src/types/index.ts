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

// =====================================================================
//  관리자 전용 (인증 필요)
// =====================================================================

/**
 * ★ 백엔드 LocaleCode 는 enum 이름 그대로 "KO" / "JA" 로 내려옵니다.
 *   프론트의 Locale 은 'ko' / 'ja' 라 대소문자가 다릅니다.
 *
 *   그냥 Locale 로 타이핑해두면 `t.locale === 'ko'` 같은 비교가 **항상 false** 인데
 *   컴파일도 통과하고 화면도 안 깨져서 발견이 늦습니다.
 *   (실제로 한국 대회 목록에 일본어 제목이 뜨고, 번역 누락 배지가 영영 안 나왔습니다.)
 *
 *   타입을 분리해 두면 컴파일러가 잘못된 비교를 전부 잡아줍니다.
 *   화면에 쓸 때는 toLocale() 로 변환하세요.
 */
export type ServerLocale = 'KO' | 'JA'

/**
 * 고객용 Booking 과 별개인 이유:
 *   고객 응답은 전화·이메일이 마스킹되어 있습니다(maskedPhone).
 *   관리자는 실제로 연락해야 하므로 원본 값을 받습니다.
 */
export interface AdminBooking {
  id: number
  bookingCode: string
  productName: string
  durationMin: number
  startAt: string
  endAt: string
  status: BookingStatus
  name: string
  phone: string
  email: string
  locale: ServerLocale
  memo: string | null
  totalPrice: number
  optionSummary: string[]
  createdAt: string
}

export interface AdminInquiry {
  id: number
  type: InquiryType
  name: string
  contact: string
  email: string
  locale: ServerLocale
  content: string
  status: InquiryStatus
  createdAt: string
  handledAt: string | null
  handledBy: string | null
  adminMemo: string | null
}

export interface AdminProduct {
  id: number
  type: ProductType
  nameKo: string
  nameJa: string | null
  descriptionKo: string | null
  descriptionJa: string | null
  durationMin: number
  price: number
  currency: string
  includesKo: string[]
  includesJa: string[]
  active: boolean
  sortOrder: number
  priceUnit: PriceUnit
  bookable: boolean
  noteKo: string | null
  noteJa: string | null
  options: { id: number; name: string; price: number; maxQuantity: number }[]
  /** 일본어 이름이 비어 있으면 false — 목록에서 "번역 필요" 배지를 띄웁니다 */
  translated: boolean
}

export interface AdminGalleryItem {
  id: number
  category: GalleryCategory
  imageKey: string
  thumbKey: string | null
  imageUrl: string | null
  thumbUrl: string | null
  ratio: 'portrait' | 'landscape' | 'square'
  takenAt: string | null
  /** 기획서 §9 — 모델 동의 없이는 공개 갤러리에 나가지 않습니다 */
  consent: boolean
  consentNote: string | null
  sortOrder: number
  translations: { locale: ServerLocale; caption: string }[]
  missingLocales: ServerLocale[]
}

/**
 * 대회는 언어별 독립 발행이라 번역 테이블 구조가 그대로 올라옵니다 (기획서 §3.2).
 * 공개 API 는 요청 언어 한 벌만 평평하게 내려주지만,
 * 관리자는 번역 누락을 봐야 하므로 전체 번역과 missingLocales 를 함께 받습니다.
 */
export interface CompetitionTranslation {
  locale: ServerLocale
  name: string
  description: string | null
  place: string | null
  host: string | null
}

export interface AdminCompetition {
  id: number
  country: Country
  startDate: string
  endDate: string
  link: string | null
  published: boolean
  translations: CompetitionTranslation[]
  missingLocales: ServerLocale[]
}

/** 업로드 응답 — 원본·중간·썸네일 3벌의 key 와 URL 을 함께 돌려줍니다. */
export interface UploadedImage {
  originalKey: string
  mediumKey: string
  thumbKey: string
  originalUrl: string
  mediumUrl: string
  thumbUrl: string
  width: number
  height: number
  ratio: 'portrait' | 'landscape' | 'square'
}

/**
 * 저장 요청 DTO들.
 *
 * ★ 응답 타입을 그대로 재사용하지 않는 이유
 *   응답에는 id·URL·missingLocales 처럼 서버가 만들어주는 값이 섞여 있습니다.
 *   그걸 그대로 되돌려 보내면 서버가 무시하거나 검증에서 걸립니다.
 *   보내는 것과 받는 것을 분리해야 "무엇이 편집 가능한가"가 타입에 드러납니다.
 */
export interface ProductSavePayload {
  type: ProductType
  nameKo: string
  nameJa: string
  descriptionKo: string
  descriptionJa: string
  durationMin: number
  price: number
  includesKo: string[]
  includesJa: string[]
  sortOrder: number
  priceUnit: PriceUnit
  bookable: boolean
  noteKo: string
  noteJa: string
}

export interface ProductOptionSavePayload {
  nameKo: string
  nameJa: string
  price: number
  maxQuantity: number
  sortOrder: number
  active: boolean
}

export interface GallerySavePayload {
  category: GalleryCategory
  imageKey: string
  thumbKey: string
  ratio: string
  takenAt: string | null
  consent: boolean
  consentNote: string
  sortOrder: number
  translations: { locale: ServerLocale; caption: string }[]
}

export interface CompetitionSavePayload {
  country: Country
  startDate: string
  endDate: string
  link: string
  published: boolean
  translations: CompetitionTranslation[]
}

export type PostCategory = 'MEDIA' | 'NOTICE'

export interface PostTranslation {
  locale: ServerLocale
  series: string
  title: string
  excerpt: string
  body: string
}

export interface AdminPost {
  id: number
  slug: string
  category: PostCategory
  thumbnailKey: string | null
  thumbnailUrl: string | null
  published: boolean
  publishedAt: string | null
  viewCount: number
  translations: PostTranslation[]
  missingLocales: ServerLocale[]
}

export interface PostSavePayload {
  slug: string
  category: PostCategory
  thumbnailKey: string
  published: boolean
  translations: PostTranslation[]
}

/** 관리자 계정. AdminRole 은 store/adminAuth 의 것과 같은 값입니다. */
export interface AdminUser {
  id: number
  username: string
  displayName: string
  role: 'SUPER_ADMIN' | 'MANAGER'
  lastLoginAt: string | null
}

export interface AdminUserCreatePayload {
  username: string
  password: string
  displayName: string
  role: 'SUPER_ADMIN' | 'MANAGER'
}

export interface PasswordChangePayload {
  currentPassword: string
  newPassword: string
}

export type Weekday =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

export interface Availability {
  id: number | null
  dayOfWeek: Weekday
  /** "HH:mm" */
  openTime: string | null
  closeTime: string | null
  /** false 면 그 요일은 휴무입니다 */
  active: boolean
}

/** 요일 기본값을 덮어쓰는 특정 날짜 예외 */
export type OverrideType = 'HOLIDAY' | 'SPECIAL'

export interface AvailabilityOverride {
  id: number
  date: string
  type: OverrideType
  openTime: string | null
  closeTime: string | null
  memo: string | null
}

export interface AvailabilityOverridePayload {
  date: string
  type: OverrideType
  openTime: string | null
  closeTime: string | null
  memo: string
}

export interface DashboardSummary {
  todayBookings: number
  pendingBookings: number
  pendingInquiries: number
  galleryAwaitingConsent: number
  monthRevenue: number
  recentBookings: AdminBooking[]
  recentInquiries: AdminInquiry[]
}

/** 백엔드 PageResponse<T> 와 동일한 형태 */
export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
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
