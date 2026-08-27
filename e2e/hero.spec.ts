import { test, expect } from '@playwright/test'

/**
 * 히어로 배너 — 엔진별로 갈리는 것들만 확인합니다.
 *
 * 기능 자체의 정합성(자동 넘김 간격, 순환 순서 등)은 이미 확인했습니다.
 * 여기서 보는 것은 **Chromium 에서 통과한 것이 다른 엔진에서도 통과하는가** 하나입니다.
 */
test.describe('히어로', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ko')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('첫 화면이 뷰포트 높이를 채운다', async ({ page }) => {
    // 100dvh 는 브라우저마다 해석이 다릅니다. 특히 모바일 Safari 의 주소창 처리가 다릅니다.
    const { slide, viewport } = await page.evaluate(() => {
      const s = document.querySelector('[aria-roledescription="slide"]')
      return {
        slide: s ? Math.round(s.getBoundingClientRect().height) : -1,
        viewport: window.innerHeight,
      }
    })

    expect(slide).toBeGreaterThan(0)
    // 1px 오차는 서브픽셀 반올림에서 나옵니다.
    expect(Math.abs(slide - viewport)).toBeLessThanOrEqual(1)
  })

  test('히어로가 헤더 뒤까지 올라온다', async ({ page }) => {
    const top = await page.evaluate(() => {
      const sec = document.querySelector('[aria-roledescription="carousel"]')
      return sec ? Math.round(sec.getBoundingClientRect().top) : -1
    })
    expect(top).toBe(0)
  })

  test('가로 스크롤바가 페이지에 생기지 않는다', async ({ page }) => {
    // scroll-snap 트랙의 폭 계산이 틀리면 페이지 전체가 가로로 밀립니다.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('제목이 헤더에 가리지 않는다', async ({ page }) => {
    const { titleTop, headerBottom } = await page.evaluate(() => {
      const h1 = document.querySelector('h1')!
      const header = document.querySelector('header')!
      return {
        titleTop: Math.round(h1.getBoundingClientRect().top),
        headerBottom: Math.round(header.getBoundingClientRect().bottom),
      }
    })
    expect(titleTop).toBeGreaterThanOrEqual(headerBottom)
  })
})

test.describe('예약 조회 화면', () => {
  test('폼이 뜨고 입력이 된다', async ({ page }) => {
    await page.goto('/ko/shooting/booking/lookup')

    const code = page.locator('#code')
    const email = page.locator('#email')
    await expect(code).toBeVisible()
    await expect(email).toBeVisible()

    await code.fill('mh-20260101-abcd')
    // 소문자로 넣어도 대문자로 보정되는지 — 입력 이벤트 처리는 엔진별로 미묘하게 다릅니다.
    await expect(code).toHaveValue('MH-20260101-ABCD')

    await email.fill('a@b.com')
    await expect(email).toHaveValue('a@b.com')
  })

  test('목 모드에서는 조회를 막고 안내한다', async ({ page }) => {
    await page.goto('/ko/shooting/booking/lookup')
    // 목 모드에는 조회할 예약이 없습니다. 알 수 없는 오류 대신 안내가 떠야 합니다.
    await expect(page.getByText('데모 화면이라 예약 조회를 사용할 수 없습니다')).toBeVisible()
    await expect(page.locator('form button[type="submit"]')).toBeDisabled()
  })
})

test.describe('일본어', () => {
  test('/ja 로 들어가면 일본어로 뜬다', async ({ page }) => {
    await page.goto('/ja')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja')
  })
})
