import { test, expect, type Page } from '@playwright/test'

/**
 * 예약 완료 → 입금 안내 박스가 뜨는지 (계좌이체 정책).
 *
 * 목 모드로 예약을 끝까지 태워 완료 화면에 도달한 뒤,
 * 계좌·입금 금액·자리표시자 경고가 실제로 렌더되는지 확인합니다.
 * 금액 계산 자체(예약금 50% / 2주 이내 전액)의 정확성은 payment.ts 의
 * computePaymentPlan 단위 성격 검증으로 덮고, 여기서는 화면 렌더를 봅니다.
 *
 * webServer 가 VITE_USE_MOCK=true 로 뜨므로 백엔드 없이 동작합니다.
 */

async function completeBooking(page: Page) {
  await page.goto('/ko/shooting/booking')

  // step 1 — 첫 예약 가능 상품
  await page.locator('button.surface-hover').first().click()

  // step 2 — 첫 예약 가능한 날짜. 다음 달로 넘겨 촬영일이 넉넉히 남게 한다.
  const next = page.getByRole('button', { name: '다음' })
  // 캘린더 이전/다음과 하단 "다음" 버튼 이름이 같을 수 있어, 달력 이동은 aria-label 로.
  const calNext = page.locator('button[aria-label="다음"]')
  if (await calNext.isEnabled().catch(() => false)) {
    await calNext.click()
  }

  // 달력 날짜 셀: 그리드 안의 활성화된 숫자 버튼 중 하나
  const days = page.locator('div.grid button:not([disabled])')
  await days.first().waitFor()
  // 가급적 달의 중반 이후 날짜를 골라 2주 이상 남기려 시도(없으면 첫 활성일)
  const count = await days.count()
  await days.nth(Math.min(count - 1, Math.floor(count * 0.6))).click()

  // 시간 슬롯 — 첫 예약 가능한 슬롯
  const slot = page.locator('button', { hasText: /^\d{2}:\d{2}$/ }).and(page.locator('button:not([disabled])'))
  await slot.first().click()

  // 다음 → 정보 입력.
  // 달력의 다음달 화살표도 aria-label="다음" 이라, aria-label 없는 실제 텍스트 버튼만 집는다.
  await page.locator('button:not([aria-label])', { hasText: '다음' }).click()

  // step 3 — 폼
  await page.locator('#name').fill('테스트고객')
  await page.locator('#phone').fill('010-1111-2222')
  await page.locator('#email').fill('e2e@test.com')
  // 개인정보 동의 체크박스(상품 옵션에 체크박스가 있을 수 있어 마지막 것을 집는다)
  await page.locator('input[type="checkbox"]').last().check()
  await page.getByRole('button', { name: '예약 신청하기' }).click()
}

test('예약 완료 화면에 입금 안내(계좌이체)가 뜬다', async ({ page }) => {
  await completeBooking(page)

  // 완료 화면 도달
  await expect(page.getByText('예약 신청이 접수되었습니다')).toBeVisible()

  // 입금 안내 박스
  await expect(page.getByText('입금 안내')).toBeVisible()

  // 계좌(자리표시자) — 실제 계좌로 교체 전에는 경고가 보여야 한다
  await expect(page.getByText('실제 계좌로 교체')).toBeVisible()
  await expect(page.getByText('000-0000-000000')).toBeVisible()

  // 지금 입금할 금액 + 예약금/전액 라벨 중 하나
  await expect(page.getByText('지금 입금할 금액')).toBeVisible()
  await expect(page.getByText(/예약금 \(50%\)|전액 결제/)).toBeVisible()

  // 환불 정책 문구
  await expect(page.getByText(/환불이 어렵습니다/)).toBeVisible()
})
