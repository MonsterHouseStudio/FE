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
        ink: {
          50: '#f7f7f8',
          100: '#e9e9ec',
          200: '#c9c9d0',
          300: '#9a9aa5',
          400: '#6b6b78',
          500: '#4a4a55',
          600: '#33333c',
          700: '#232329',
          800: '#171719',
          900: '#0e0e10',
          950: '#08080a',
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
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'fade-in': 'fade-in 0.4s ease-out both',
        marquee: 'marquee 28s linear infinite',
      },
    },
  },
  plugins: [],
}
