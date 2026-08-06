/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_YOUTUBE_CHANNEL_URL?: string
  readonly VITE_LINE_ADD_FRIEND_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
