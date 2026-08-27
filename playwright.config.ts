import { defineConfig, devices } from '@playwright/test'

/**
 * 크로스 브라우저 검증.
 *
 * 이걸 붙인 이유는 히어로 배너에 쓴 기능들이 **브라우저마다 다르게 동작**하기 때문입니다.
 * `scroll-snap`, `100dvh`, `inert`, 비디오 자동재생 — 전부 엔진별 차이가 큽니다.
 * Chromium 하나에서 통과한 것은 그 세 가지에 대해 아무것도 보장하지 않습니다.
 *
 * WebKit 이 특히 중요합니다. iOS Safari 와 같은 엔진이라, 실기기 없이도
 * Safari 계열에서 깨지는지 여기서 잡을 수 있습니다.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: [['list']],
  // 목 모드로 띄웁니다. 이 테스트가 확인하려는 것은 렌더링·레이아웃이지 백엔드가 아닙니다.
  webServer: {
    command: 'npx vite --port 5199 --strictPort',
    url: 'http://localhost:5199',
    reuseExistingServer: true,
    timeout: 120_000,
    env: { VITE_USE_MOCK: 'true' },
  },
  use: {
    baseURL: 'http://localhost:5199',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    // iOS Safari 는 데스크톱 WebKit 과도 다릅니다 — 뷰포트 단위와 자동재생 정책이 특히.
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],
})
