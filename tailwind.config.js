/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // MHLogo.jpg 에서 추출한 브랜드 컬러
        brand: {
          50: '#fdf2f2',
          100: '#fbe5e5',
          200: '#f5bcbc',
          300: '#eb8a8a',
          400: '#d94a4a',
          500: '#b81f1f',
          600: '#8b0a0a', // 로고 배경
          700: '#6d0808',
          800: '#4f0505',
          900: '#330303',
          950: '#1a0101',
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
        // display 를 별도 영문 폰트(Impact 등)로 두면 한글·일본어 글자만
        // 폴백 폰트로 떨어져 한 제목 안에서 서체가 갈라집니다.
        // 웹폰트를 붙이기 전까지는 sans 와 같은 스택 + font-black 으로 무게를 냅니다.
        display: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"Malgun Gothic"',
          '"Yu Gothic"',
          '"Hiragino Kaku Gothic ProN"',
          'Meiryo',
          'sans-serif',
        ],
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
