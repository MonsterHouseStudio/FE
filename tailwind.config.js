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
        // ink 은 CSS 변수로 구동 → 다크/라이트 테마에서 값만 스왑(index.css 참고).
        // 낮은 번호 = 텍스트, 높은 번호 = 배경 (다크에선 반대로 매핑됨).
        ink: {
          50: 'rgb(var(--ink-50) / <alpha-value>)',
          100: 'rgb(var(--ink-100) / <alpha-value>)',
          200: 'rgb(var(--ink-200) / <alpha-value>)',
          300: 'rgb(var(--ink-300) / <alpha-value>)',
          400: 'rgb(var(--ink-400) / <alpha-value>)',
          500: 'rgb(var(--ink-500) / <alpha-value>)',
          600: 'rgb(var(--ink-600) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
          800: 'rgb(var(--ink-800) / <alpha-value>)',
          900: 'rgb(var(--ink-900) / <alpha-value>)',
          950: 'rgb(var(--ink-950) / <alpha-value>)',
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
