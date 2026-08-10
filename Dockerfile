# ---------- build stage ----------
FROM node:22-alpine AS builder
WORKDIR /app

# package.json 만 먼저 복사해 의존성 레이어를 캐싱합니다.
# 소스만 바뀌면 npm ci 를 다시 돌리지 않습니다.
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# ★ Vite 는 VITE_* 를 "빌드 시점"에 번들에 박아 넣습니다.
#   런타임 환경변수로는 절대 못 바꾸므로 반드시 여기서 정해야 합니다.
#   운영에서 목 데이터가 나가는 사고를 막기 위해 기본값을 false 로 둡니다.
ARG VITE_USE_MOCK=false
ARG VITE_API_BASE_URL=/api
ARG VITE_YOUTUBE_CHANNEL_URL=
ARG VITE_LINE_ADD_FRIEND_URL=

ENV VITE_USE_MOCK=$VITE_USE_MOCK \
    VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_YOUTUBE_CHANNEL_URL=$VITE_YOUTUBE_CHANNEL_URL \
    VITE_LINE_ADD_FRIEND_URL=$VITE_LINE_ADD_FRIEND_URL

RUN npm run build

# ---------- runtime stage ----------
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html

ENV TZ=Asia/Seoul

COPY --from=builder /app/dist ./
COPY nginx.conf /etc/nginx/conf.d/default.conf

# nginx 이미지의 기본 프로세스는 root 로 뜨지만 워커는 nginx 유저로 내려갑니다.
# 80 은 특권 포트라 비루트로 바꾸려면 포트까지 함께 올려야 하므로 기본 구성을 유지합니다.
EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1
