import { daysUntil } from './utils'

/**
 * 결제 정책 — 계좌이체(수동 입금 확인).
 *
 * 사장님 정책(2026-08):
 *  - 스케줄 확정을 위해 결제금의 50% 를 예약금으로 먼저 받는다.
 *  - 나머지 50%(잔금)는 촬영일 2주 전까지 완납한다.
 *  - 촬영이 2주 이내이고 슬롯이 비어 있으면 전액을 한 번에 받는다.
 *  - 스튜디오 귀책이 아니면 환불하지 않는다.
 *
 * 결제 API 가 없으므로 입금 확인은 사장님이 통장을 보고 수동으로 합니다
 * (예약 상태 REQUESTED → CONFIRMED). 이 파일은 "얼마를, 어디로 보내야 하는지"를
 * 계산해 보여주는 표시 로직만 담당합니다.
 */

/** 예약금 비율. */
export const DEPOSIT_RATIO = 0.5

/** 이 일수 이내에 촬영이면 예약금이 아니라 전액을 한 번에 받습니다. */
export const FULL_PAYMENT_WITHIN_DAYS = 14

/**
 * ⚠⚠⚠ 실제 계좌로 교체하세요 ⚠⚠⚠
 * 아래는 자리표시자입니다. 진짜 계좌가 아닙니다. 배포 전 반드시 실제 값으로 바꾸세요.
 * (이 한 곳만 바꾸면 예약 완료 화면·안내에 모두 반영됩니다.)
 */
export const BANK_ACCOUNT = {
  bank: '○○은행',
  number: '000-0000-000000',
  holder: '몬스터하우스',
  isPlaceholder: true, // 실제 계좌로 바꾼 뒤 false 로 두면 경고 배너가 사라집니다.
} as const

export type PaymentMode = 'DEPOSIT' | 'FULL'

export interface PaymentPlan {
  /** DEPOSIT = 예약금 50% 선입금 / FULL = 전액 선입금(촬영 임박) */
  mode: PaymentMode
  /** 지금 입금해야 할 금액 */
  dueNow: number
  /** 남은 잔금 (FULL 이면 0) */
  balance: number
  /** 결제 총액 */
  total: number
  /** 촬영이 임박(2주 이내)해서 전액인지 */
  imminent: boolean
}

/**
 * 총액과 촬영일로 "지금 얼마를 입금해야 하는지"를 계산합니다.
 *
 * 예약금은 원 단위 반올림합니다. 잔금은 (총액 − 예약금)으로 두어
 * 반올림 오차가 있어도 예약금+잔금이 항상 총액과 정확히 일치하게 합니다.
 */
export function computePaymentPlan(total: number, shootDateISO: string): PaymentPlan {
  const imminent = daysUntil(shootDateISO) <= FULL_PAYMENT_WITHIN_DAYS

  if (imminent) {
    return { mode: 'FULL', dueNow: total, balance: 0, total, imminent: true }
  }

  const deposit = Math.round(total * DEPOSIT_RATIO)
  return { mode: 'DEPOSIT', dueNow: deposit, balance: total - deposit, total, imminent: false }
}
