/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // MHLogo.jpg 에서 추출한 브랜드 컬러
        brand: {
          50: '#fef2f2',
          100: '#fde3e4',
          200: '#fbc7ca',
          300: '#f79aa0',
          400: '#f75d68',
          500: '#ef2b3a',
          600: '#e11d2a', // 메인 (밝은 스칼렛)
          700: '#bd1421',
          800: '#9a141d',
          900: '#7a141b',
          950: '#40090c',
        },
        // 크림/아이보리 라이트 테마.
        // ★ 스케일을 반전했습니다: 낮은 번호 = 진한 텍스트, 높은 번호 = 크림 배경.
        //   (기존 다크 테마 클래스 bg-ink-950/text-ink-100 등이 그대로 라이트로 뒤집힘)
        ink: {
          50: '#1b1611', // 가장 진한 텍스트(제목)
          100: '#2b241c', // 본문 텍스트
          200: '#41382c', // 강한 보조 텍스트
          300: '#5b5142', // 보조 텍스트
          400: '#786c58', // 뮤트 텍스트
          500: '#95886f', // 흐린 텍스트/캡션
          600: '#b3a68b', // 아주 흐린 텍스트/구분선 글자
          700: '#d3c8b1', // 테두리
          800: '#e6dcc7', // 밝은 테두리/서브 서피스
          900: '#f1ead9', // 서피스(카드)
          950: '#f8f2e6', // 페이지 배경(크림/아이보리)
        },
      },
      fontFamily: {
        sans: [
          'Pretendard',
          '"Pretendard JP"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"Malgun Gothic"',
          '"Yu Gothic"',
          '"Hiragino Kaku Gothic ProN"',
          'Meiryo',
          'Roboto',
          'sans-serif',
        ],
        // 제목: 한/일/영을 한 폰트로 덮어야 서체가 안 갈라집니다.
        // Pretendard 900(Black)을 실제 로드해 굵게 냅니다(일본어는 Pretendard JP).
        display: [
          'Pretendard',
          '"Pretendard JP"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"Malgun Gothic"',
          '"Yu Gothic"',
          '"Hiragino Kaku Gothic ProN"',
          'Meiryo',
          'sans-serif',
        ],
        // 영문 전용 라벨(BODYBUILDING MEDIA, SERVICES…)에만 쓰는 임팩트 서체.
        // Anton 은 라틴 전용이라 한/일 요소에는 쓰지 않습니다(폴백으로 Pretendard).
        poster: ['Anton', 'Pretendard', '"Pretendard JP"', 'sans-serif'],
      },
      letterSpacing: {
        // CJK 는 자간을 많이 좁히면 글자가 붙어 보입니다. -0.045em → -0.02em
        tightest: '-0.02em',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        // 소개 콜라주 사진의 "떠있는" 느낌 (translateY 만 → 부모의 rotate 기울임과 합성)
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'fade-in': 'fade-in 0.4s ease-out both',
        marquee: 'marquee 28s linear infinite',
        float: 'float 6.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
