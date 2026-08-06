import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  // ⚠ vite.config.ts 안에서는 .env 가 process.env 로 들어오지 않습니다.
  //   process.env.VITE_API_PROXY_TARGET 은 항상 undefined 라서 기본값으로 넘어가고,
  //   그 결과 "프록시를 설정했는데 엉뚱한 포트로 나가는" 상태가 됩니다.
  //   .env 를 읽으려면 loadEnv 를 써야 합니다.
  //   세 번째 인자 '' 는 "VITE_ 접두사 필터 없이 전부" 라는 뜻입니다.
  const env = loadEnv(mode, __dirname, '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: Number(process.env.PORT) || 5173,
      // 백엔드(Spring Boot)가 뜨면 VITE_USE_MOCK=false 로 두고 이 프록시를 씁니다.
      // 8080 이 다른 앱에 점유되어 BE 를 다른 포트로 띄웠다면
      // .env 의 VITE_API_PROXY_TARGET 만 바꾸면 됩니다.
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
        },
        // 로컬 스토리지 모드(app.storage.type=local)에서 백엔드가 내려주는
        // 이미지 URL 은 /uploads/... 상대경로입니다.
        // 프록시하지 않으면 Vite 의 SPA 폴백이 index.html 을 200 으로 돌려주고,
        // 브라우저는 그걸 이미지로 디코딩하지 못해 조용히 깨집니다(404 도 안 뜹니다).
        // 운영에서는 nginx 가 같은 오리진에서 /uploads 와 /api 를 함께 서빙합니다.
        '/uploads': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  }
})
