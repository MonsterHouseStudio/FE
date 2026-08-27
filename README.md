# MONSTER HOUSE — Frontend

촬영 예약 · 한일 이중언어 미디어 사이트의 웹 클라이언트입니다.
조직 소개와 화면은 [MonsterHouseStudio](https://github.com/MonsterHouseStudio) 를 보세요.

React 18 · TypeScript · Vite 5 · Tailwind 3 · TanStack Query 5 · Zustand · react-i18next

---

## 실행

```bash
cp .env.example .env
npm install
npm run dev
```

백엔드([MonsterHouseStudio/BE](https://github.com/MonsterHouseStudio/BE))가 8080 에 떠 있어야 합니다.
다른 포트면 `.env` 의 `VITE_API_PROXY_TARGET` 만 바꾸면 됩니다.

백엔드 없이 화면만 보려면 `.env` 에 `VITE_USE_MOCK=true` 를 넣으세요.

```bash
npx tsc --noEmit   # 타입 검사
npm run build      # 프로덕션 빌드
npm run e2e        # 크로스 브라우저 (Chromium · Firefox · WebKit · iOS Safari)
```

`npm run e2e` 는 처음 한 번 `npx playwright install` 이 필요합니다.

---

## 구조

```
src/
├── pages/            공개 11화면
│   └── admin/        관리자 11화면
├── components/
│   ├── layout/       헤더 · 푸터 · 로고
│   ├── home/         히어로 배너 캐러셀
│   └── ui/           버튼 · 배지 · 공통 요소
├── lib/api.ts        모든 서버 통신 (목 구현 포함)
├── i18n/locales/     ko.json · ja.json
├── store/            관리자 인증 상태
└── types/            서버 응답 타입
```

---

## 알아둘 것

### 1. `VITE_USE_MOCK` 의 기본값은 "끔" 입니다

```ts
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
```

예전에는 `!== 'false'` 였습니다. 즉 **변수를 빠뜨리면 목이 켜졌습니다.**
Vite 의 환경변수는 빌드 시점에 값이 박히므로, 배포 대시보드에 변수를 넣는 걸 잊으면
운영 사이트가 가짜 데이터로 뜹니다 — 크루 소개의 실명까지요. 재배포로는 안 고쳐지고
다시 빌드해야 합니다.

설정 누락 시 **가짜 데이터로 조용히 뜨는 것보다 API 를 못 붙어 눈에 띄게 실패하는 편**이 안전합니다.

### 2. 언어는 URL 로 갈립니다

`/ko/...` `/ja/...` 로 라우팅되고 `X-Locale` 헤더로 서버에 전달됩니다.

서버가 내려주는 `locale` 값은 **대문자**(`KO` / `JA`)이고 프론트의 라우트 값은 소문자입니다.
둘을 그대로 비교하면 항상 false 라 조용히 틀립니다 — 그래서 `ServerLocale` 타입을 따로 뒀습니다.

### 3. 관리자 토큰

액세스 토큰은 `sessionStorage`, 리프레시는 **httpOnly 쿠키**입니다.
XSS 로 영구 세션까지 털리지 않게 하기 위해서입니다.

401 이 뜨면 리프레시 후 한 번만 재시도합니다. 동시에 여러 요청이 401 을 받아도
리프레시는 **한 번만** 나갑니다(`store/adminAuth.ts` 의 in-flight 공유) —
여러 번 나가면 서버의 토큰 재사용 탐지에 걸려 전체 세션이 끊깁니다.

### 4. 히어로 배너 캐러셀

캐러셀 라이브러리 없이 CSS `scroll-snap` 으로 구현했습니다.
모바일 스와이프·트랙패드 관성·접근성이 브라우저 기본 동작으로 따라옵니다.

높이는 `100dvh` 입니다 — 모바일에서 `100vh` 는 주소창이 접힌 상태 기준이라 아래가 잘립니다.

검증 기록은 [`.github/reports/2026-08-18-hero-banner.md`](.github/reports/2026-08-18-hero-banner.md) 에 있습니다.
**확인하지 못한 것**(iOS 실기기 자동재생 등)도 같이 적혀 있습니다.

### 5. 고객용 예약 조회

`/{locale}/shooting/booking/lookup` 에서 **예약번호 + 이메일**로 조회·취소·시간 변경을 합니다.
로그인이 없는 서비스라 이메일이 사실상 비밀번호 역할을 하고, 검증은 서버가 합니다.

---

## 아직 안 된 것

- **일본어 감수** — `ja.json` 과 백엔드 `messages_ja.properties` 모두 기계 번역 초안입니다
- **실기기 확인** — Playwright 의 WebKit 으로 Safari 엔진은 검증하지만,
  실제 iPhone 의 저전력 모드 자동재생 차단까지는 재현되지 않습니다

---

## 관련

- 백엔드 — [MonsterHouseStudio/BE](https://github.com/MonsterHouseStudio/BE)
