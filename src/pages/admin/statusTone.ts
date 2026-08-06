import type { BookingStatus } from '@/types'

export const STATUS_TONE: Record<BookingStatus, 'brand' | 'neutral' | 'success' | 'warning' | 'danger'> = {
  REQUESTED: 'warning',
  CONFIRMED: 'brand',
  COMPLETED: 'success',
  CANCELED: 'danger',
}
