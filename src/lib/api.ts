import type { Locale } from '@/i18n'
import type {
  AdminBooking,
  AdminCompetition,
  AdminGalleryItem,
  AdminInquiry,
  AdminPost,
  AdminProduct,
  AdminUser,
  AdminUserCreatePayload,
  ApiResponse,
  Availability,
  AvailabilityOverride,
  AvailabilityOverridePayload,
  Booking,
  BookingCreatePayload,
  BookingStatus,
  Competition,
  DailySlots,
  CompetitionSavePayload,
  DashboardSummary,
  GalleryItem,
  GallerySavePayload,
  InquiryCreatePayload,
  InquiryStatus,
  PageResponse,
  Post,
  PasswordChangePayload,
  PostSavePayload,
  Product,
  ProductOptionSavePayload,
  ProductSavePayload,
  UploadedImage,
  Weekday,
} from '@/types'
import { COMPETITIONS, POSTS, PRODUCTS, galleryItems } from '@/mocks/data'
import { currentAccessToken, refreshAccessToken } from '@/store/adminAuth'
import { delay, toDateKey } from './utils'
import { BOOKING_POLICY, latestBookableDate } from './bookingPolicy'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

/** 백엔드 연동 시 사용. 실패하면 ApiError 를 던집니다. */
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message)
  }
}

async function request<T>(path: string, locale: Locale, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      // 백엔드 ApiLocaleResolver 가 읽는 헤더
      'X-Locale': locale,
      ...init?.headers,
    },
  })

  const json = (await res.json()) as ApiResponse<T>

  if (!res.ok || !json.success) {
    throw new ApiError(json.error?.code ?? 'UNKNOWN', json.error?.message ?? 'Request failed')
  }
  return json.data as T
}

// =====================================================================
//  목 구현 — 백엔드 SlotService/BookingService 의 규칙을 그대로 흉내냅니다.
// =====================================================================

const {
  slotStepMin: SLOT_STEP_MIN,
  bufferMin: BUFFER_MIN,
  openHour: OPEN_HOUR,
  closeHour: CLOSE_HOUR,
  closedWeekday: CLOSED_WEEKDAY,
  minLeadHours: MIN_LEAD_HOURS,
} = BOOKING_POLICY

/** 날짜+시각으로 결정되는 의사난수 — 새로고침해도 마감 슬롯이 흔들리지 않게 */
function pseudoRandom(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 1000) / 1000
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function mockDailySlots(productId: number, date: string, locale: Locale): DailySlots {
  const product = PRODUCTS[locale].find((p) => p.id === productId)
  const target = new Date(date + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const maxDate = latestBookableDate()

  if (!product) {
    return { productId, date, open: false, closedReason: 'OUT_OF_RANGE', slots: [] }
  }
  if (target < today || target > maxDate) {
    return { productId, date, open: false, closedReason: 'OUT_OF_RANGE', slots: [] }
  }
  if (target.getDay() === CLOSED_WEEKDAY) {
    return { productId, date, open: false, closedReason: 'CLOSED_DAY', slots: [] }
  }

  const totalMin = product.durationMin + BUFFER_MIN
  const slots = []

  for (let min = OPEN_HOUR * 60; min + totalMin <= CLOSE_HOUR * 60; min += SLOT_STEP_MIN) {
    const startH = Math.floor(min / 60)
    const startM = min % 60
    const endMin = min + totalMin
    const startAt = `${date}T${pad(startH)}:${pad(startM)}`
    const endAt = `${date}T${pad(Math.floor(endMin / 60))}:${pad(endMin % 60)}`

    // 약 30% 를 이미 예약된 것으로 표시해 실제 운영처럼 보이게 합니다.
    const taken = pseudoRandom(`${date}-${productId}-${min}`) < 0.3

    // 리드타임 이내는 신청 불가
    const startDate = new Date(startAt)
    const tooLate = startDate.getTime() - Date.now() < MIN_LEAD_HOURS * 3600 * 1000

    slots.push({ startAt, endAt, available: !taken && !tooLate })
  }

  return { productId, date, open: true, closedReason: null, slots }
}

function mockBookingCode(): string {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  const suffix = Array.from(
    { length: 4 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join('')
  return `MH-${toDateKey(new Date()).replace(/-/g, '')}-${suffix}`
}

// =====================================================================
//  공개 API
// =====================================================================

export const api = {
  async getProducts(locale: Locale): Promise<Product[]> {
    if (!USE_MOCK) return request<Product[]>('/products', locale)
    await delay(180)
    return PRODUCTS[locale]
  },

  async getDailySlots(productId: number, date: string, locale: Locale): Promise<DailySlots> {
    if (!USE_MOCK) {
      return request<DailySlots>(`/products/${productId}/slots?date=${date}`, locale)
    }
    await delay(220)
    return mockDailySlots(productId, date, locale)
  },

  async createBooking(payload: BookingCreatePayload, locale: Locale): Promise<Booking> {
    if (!USE_MOCK) {
      return request<Booking>('/bookings', locale, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }

    await delay(700)

    const product = PRODUCTS[locale].find((p) => p.id === payload.productId)
    const start = new Date(payload.startAt)
    const end = new Date(start.getTime() + ((product?.durationMin ?? 60) + BUFFER_MIN) * 60_000)

    return {
      bookingCode: mockBookingCode(),
      productName: product?.name ?? '',
      durationMin: product?.durationMin ?? 60,
      startAt: payload.startAt,
      endAt: `${toDateKey(end)}T${pad(end.getHours())}:${pad(end.getMinutes())}`,
      status: 'REQUESTED',
      name: payload.name,
      maskedPhone: payload.phone.slice(0, 3) + '*'.repeat(Math.max(0, payload.phone.length - 3)),
      maskedEmail: payload.email.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(b.length) + c),
      memo: payload.memo ?? null,
      basePrice: product?.price ?? 0,
      options: (payload.options ?? []).map((sel) => {
        const opt = product?.options?.find((o) => o.id === sel.optionId)
        const unitPrice = opt?.price ?? 0
        return {
          name: opt?.name ?? '',
          unitPrice,
          quantity: sel.quantity,
          amount: unitPrice * sel.quantity,
        }
      }),
      totalPrice:
        (product?.price ?? 0) +
        (payload.options ?? []).reduce((sum, sel) => {
          const opt = product?.options?.find((o) => o.id === sel.optionId)
          return sum + (opt?.price ?? 0) * sel.quantity
        }, 0),
      createdAt: new Date().toISOString(),
    }
  },

  async getCompetitions(locale: Locale): Promise<Competition[]> {
    if (!USE_MOCK) return request<Competition[]>('/competitions', locale)
    await delay(160)
    return COMPETITIONS[locale]
  },

  async getGallery(locale: Locale): Promise<GalleryItem[]> {
    if (!USE_MOCK) return request<GalleryItem[]>('/gallery', locale)
    await delay(200)
    return galleryItems(locale)
  },

  /**
   * 기획서 §3.2 폴백 정책: 요청 언어의 번역이 없는 글은 목록에서 제외합니다.
   *
   * 실제 API 에서는 서버가 이미 걸러서 내려줍니다(번역 없는 글은 쿼리에서 빠짐).
   * 목 모드에서만 availableLocales 로 흉내냅니다.
   *
   * 서버는 페이지 응답을 주므로 content 만 꺼내 씁니다.
   * 미디어 글이 수백 건이 되면 그때 무한스크롤로 바꾸면 됩니다.
   */
  async getPosts(locale: Locale): Promise<Post[]> {
    if (!USE_MOCK) {
      const page = await request<PageResponse<Post>>('/posts?size=50', locale)
      return page.content
    }
    await delay(180)
    return POSTS[locale].filter((p) => p.availableLocales?.includes(locale) ?? true)
  },

  async getPost(slug: string, locale: Locale): Promise<Post | null> {
    if (!USE_MOCK) {
      try {
        return await request<Post>(`/posts/${encodeURIComponent(slug)}`, locale)
      } catch (error) {
        // 번역이 없는 글을 직접 URL 로 열면 서버가 404(P001)를 줍니다.
        // 그건 오류가 아니라 "이 언어에는 없는 글"이므로 null 로 바꿔
        // 상세 화면이 안내 문구를 띄우게 합니다.
        if (error instanceof ApiError && error.code === 'P001') return null
        throw error
      }
    }
    await delay(150)
    return POSTS[locale].find((p) => p.slug === slug) ?? null
  },

  async createInquiry(payload: InquiryCreatePayload, locale: Locale): Promise<{ id: number }> {
    if (!USE_MOCK) {
      return request<{ id: number }>('/inquiries', locale, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    await delay(650)
    return { id: Math.floor(Math.random() * 10000) }
  },

}

// =====================================================================
//  관리자 API
//
//  공개 API 와 달리 목 구현이 없습니다.
//  관리자 화면은 "실제 데이터를 실제로 바꾸는" 것이 목적이라
//  가짜 응답으로 확인해봐야 의미가 없기 때문입니다.
//  따라서 VITE_USE_MOCK 값과 무관하게 항상 백엔드를 호출합니다.
// =====================================================================

/**
 * 액세스 토큰을 붙이고, 만료되면 한 번 재발급 후 재시도합니다.
 *
 * retry 플래그로 1회로 제한하는 이유:
 *   재발급까지 실패했는데 계속 재시도하면 무한 루프가 됩니다.
 *   두 번째 401 은 "정말 권한이 없다"는 뜻이므로 그대로 던져
 *   AdminLayout 이 로그인 화면으로 보내게 합니다.
 */
async function adminRequest<T>(path: string, init?: RequestInit, retry = true): Promise<T> {
  const token = currentAccessToken()

  // ★ 파일 업로드(FormData)일 때는 Content-Type 을 직접 넣으면 안 됩니다.
  //   multipart 는 헤더에 경계 문자열(boundary)이 들어가야 하는데,
  //   'application/json' 으로 덮어쓰면 서버가 본문을 파싱하지 못해
  //   "Required part 'file' is not present" 로 실패합니다.
  //   비워두면 브라우저가 boundary 를 포함해 알아서 채웁니다.
  const isMultipart = init?.body instanceof FormData

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    // 재발급 요청에 리프레시 쿠키가 실려야 합니다.
    credentials: 'include',
    headers: {
      ...(isMultipart ? {} : { 'Content-Type': 'application/json' }),
      // 관리자 화면은 한국어 고정입니다 (사장님이 보는 화면).
      'X-Locale': 'ko',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (res.status === 401 && retry) {
    const session = await refreshAccessToken()
    if (session) return adminRequest<T>(path, init, false)
  }

  // 본문 없는 응답(204)도 있습니다. json() 을 그냥 부르면 여기서 터집니다.
  if (res.status === 204) return undefined as T

  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null

  if (!res.ok || !json?.success) {
    throw new ApiError(json?.error?.code ?? 'UNKNOWN', json?.error?.message ?? '요청에 실패했습니다.')
  }
  return json.data as T
}

function query(params: Record<string, string | number | undefined | null>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  )
  return entries.length ? '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])) : ''
}

export const adminApi = {
  // ----- 대시보드 -----
  getDashboard: () => adminRequest<DashboardSummary>('/admin/dashboard'),

  // ----- 예약 -----
  getBookings: (params: {
    status?: BookingStatus | ''
    from?: string
    to?: string
    keyword?: string
    page?: number
    size?: number
  }) => adminRequest<PageResponse<AdminBooking>>('/admin/bookings' + query(params)),

  getCalendar: (from: string, to: string) =>
    adminRequest<Booking[]>(`/admin/bookings/calendar${query({ from, to })}`),

  confirmBooking: (id: number) =>
    adminRequest<Booking>(`/admin/bookings/${id}/confirm`, { method: 'POST' }),

  completeBooking: (id: number) =>
    adminRequest<Booking>(`/admin/bookings/${id}/complete`, { method: 'POST' }),

  cancelBooking: (id: number, reason?: string) =>
    adminRequest<Booking>(`/admin/bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason ?? '' }),
    }),

  /** startAt 형식은 "yyyy-MM-ddTHH:mm" 입니다 (초를 붙이면 400). */
  rescheduleBooking: (id: number, startAt: string) =>
    adminRequest<Booking>(`/admin/bookings/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({ startAt }),
    }),

  // ----- 문의 -----
  getInquiries: (params: { status?: InquiryStatus | ''; page?: number; size?: number }) =>
    adminRequest<PageResponse<AdminInquiry>>('/admin/inquiries' + query(params)),

  handleInquiry: (id: number, adminMemo?: string) =>
    adminRequest<AdminInquiry>(`/admin/inquiries/${id}/handle`, {
      method: 'POST',
      body: JSON.stringify({ adminMemo: adminMemo ?? '' }),
    }),

  reopenInquiry: (id: number) =>
    adminRequest<AdminInquiry>(`/admin/inquiries/${id}/pending`, { method: 'POST' }),

  // ----- 이미지 업로드 -----
  /**
   * ★ Content-Type 을 직접 지정하면 안 됩니다.
   *   multipart 는 경계 문자열(boundary)이 헤더에 들어가야 하는데,
   *   'application/json' 을 덮어써 버리면 서버가 본문을 파싱하지 못합니다.
   *   FormData 를 넘기면 브라우저가 boundary 를 포함해 알아서 채웁니다.
   */
  uploadImage: (file: File, directory: 'gallery' | 'post' | 'product') => {
    const form = new FormData()
    form.append('file', file)
    return adminRequest<UploadedImage>(`/admin/uploads/images${query({ directory })}`, {
      method: 'POST',
      body: form,
    })
  },

  // ----- 상품 -----
  getProducts: () => adminRequest<AdminProduct[]>('/admin/products'),

  createProduct: (payload: ProductSavePayload) =>
    adminRequest<AdminProduct>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateProduct: (id: number, payload: ProductSavePayload) =>
    adminRequest<AdminProduct>(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteProduct: (id: number) => adminRequest<void>(`/admin/products/${id}`, { method: 'DELETE' }),

  setProductActive: (id: number, active: boolean) =>
    adminRequest<AdminProduct>(`/admin/products/${id}/active${query({ active: String(active) })}`, {
      method: 'PATCH',
    }),

  addProductOption: (productId: number, payload: ProductOptionSavePayload) =>
    adminRequest<AdminProduct>(`/admin/products/${productId}/options`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateProductOption: (productId: number, optionId: number, payload: ProductOptionSavePayload) =>
    adminRequest<AdminProduct>(`/admin/products/${productId}/options/${optionId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteProductOption: (productId: number, optionId: number) =>
    adminRequest<void>(`/admin/products/${productId}/options/${optionId}`, { method: 'DELETE' }),

  // ----- 대회 일정 -----
  getCompetitions: () => adminRequest<AdminCompetition[]>('/admin/competitions'),

  createCompetition: (payload: CompetitionSavePayload) =>
    adminRequest<AdminCompetition>('/admin/competitions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateCompetition: (id: number, payload: CompetitionSavePayload) =>
    adminRequest<AdminCompetition>(`/admin/competitions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteCompetition: (id: number) =>
    adminRequest<void>(`/admin/competitions/${id}`, { method: 'DELETE' }),

  // ----- 미디어 글 -----
  getPosts: () => adminRequest<AdminPost[]>('/admin/posts'),

  createPost: (payload: PostSavePayload) =>
    adminRequest<AdminPost>('/admin/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updatePost: (id: number, payload: PostSavePayload) =>
    adminRequest<AdminPost>(`/admin/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deletePost: (id: number) => adminRequest<void>(`/admin/posts/${id}`, { method: 'DELETE' }),

  // ----- 갤러리 -----
  getGallery: () => adminRequest<AdminGalleryItem[]>('/admin/gallery'),

  createGalleryItem: (payload: GallerySavePayload) =>
    adminRequest<AdminGalleryItem>('/admin/gallery', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateGalleryItem: (id: number, payload: GallerySavePayload) =>
    adminRequest<AdminGalleryItem>(`/admin/gallery/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  setGalleryConsent: (id: number, consent: boolean, consentNote?: string) =>
    adminRequest<AdminGalleryItem>(`/admin/gallery/${id}/consent`, {
      method: 'PATCH',
      body: JSON.stringify({ consent, consentNote: consentNote ?? '' }),
    }),

  deleteGalleryItem: (id: number) =>
    adminRequest<void>(`/admin/gallery/${id}`, { method: 'DELETE' }),

  // ----- 관리자 계정 -----
  // 목록·생성·비활성화는 SUPER_ADMIN 전용입니다 (@PreAuthorize).
  // MANAGER 가 호출하면 403 이 오므로 화면에서 미리 감춥니다.
  getAdminUsers: () => adminRequest<AdminUser[]>('/admin/users'),

  createAdminUser: (payload: AdminUserCreatePayload) =>
    adminRequest<AdminUser>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  disableAdminUser: (id: number) =>
    adminRequest<void>(`/admin/users/${id}/disable`, { method: 'POST' }),

  /** 본인 비밀번호 변경. 성공하면 서버가 기존 리프레시 토큰을 전부 폐기합니다. */
  changeMyPassword: (payload: PasswordChangePayload) =>
    adminRequest<void>('/admin/users/me/password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // ----- 영업시간 -----
  getAvailability: () => adminRequest<Availability[]>('/admin/availability'),

  /**
   * ⚠ 서버는 요일 하나씩 받습니다 (AvailabilityUpsertRequest 단건).
   *   배열로 보내면 400 입니다. 화면에서 요일별로 각각 호출하세요.
   */
  saveAvailability: (payload: {
    dayOfWeek: Weekday
    openTime: string
    closeTime: string
    active: boolean
  }) =>
    adminRequest<Availability>('/admin/availability', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  getOverrides: (from: string, to: string) =>
    adminRequest<AvailabilityOverride[]>(`/admin/availability/overrides${query({ from, to })}`),

  saveOverride: (payload: AvailabilityOverridePayload) =>
    adminRequest<AvailabilityOverride>('/admin/availability/overrides', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteOverride: (id: number) =>
    adminRequest<void>(`/admin/availability/overrides/${id}`, { method: 'DELETE' }),
}
