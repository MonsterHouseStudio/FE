/**
 * 예약 정책의 단일 진실 공급원.
 *
 * 백엔드 application.yml 의 app.booking.* 와 값이 같아야 합니다.
 * 달력·슬롯 목록·목 API 가 각자 상수를 들고 있으면
 * "달력에서는 고를 수 있는데 시간은 전부 마감"인 상태가 생깁니다.
 */
export const BOOKING_POLICY = {
  /** 슬롯 시작 시각 간격(분) */
  slotStepMin: 30,
  /** 촬영 후 정리·이동 버퍼(분) */
  bufferMin: 15,
  openHour: 10,
  closeHour: 20,
  /** 정기 휴무 요일 (0=일 … 1=월) */
  closedWeekday: 1,
  /** 오늘로부터 며칠 뒤까지 예약 가능한가 */
  maxAdvanceDays: 90,
  /** 최소 몇 시간 전까지 신청 가능한가 */
  minLeadHours: 24,
} as const

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * 예약 가능한 가장 이른 날짜.
 * 리드타임이 24시간이면 오늘은 어떤 슬롯도 잡을 수 없으므로 내일부터입니다.
 * (내일은 이른 시간대만 일부 마감될 수 있고, 그건 슬롯 단위로 다시 걸러집니다)
 */
export function earliestBookableDate(now = new Date()): Date {
  const days = Math.ceil(BOOKING_POLICY.minLeadHours / 24)
  const d = startOfDay(now)
  d.setDate(d.getDate() + days)
  return d
}

/** 예약 가능한 가장 늦은 날짜 */
export function latestBookableDate(now = new Date()): Date {
  const d = startOfDay(now)
  d.setDate(d.getDate() + BOOKING_POLICY.maxAdvanceDays)
  return d
}

/** 그 날짜에 슬롯이 생길 수 있는가 (휴무·기간 검사만. 잔여 여부는 별개) */
export function isSelectableDate(date: Date, now = new Date()): boolean {
  const target = startOfDay(date)
  if (target < earliestBookableDate(now)) return false
  if (target > latestBookableDate(now)) return false
  if (target.getDay() === BOOKING_POLICY.closedWeekday) return false
  return true
}
