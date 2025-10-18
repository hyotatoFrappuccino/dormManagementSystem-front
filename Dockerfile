# 1. 의존성 설치 단계 (deps)
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
# 빌드를 위해 모든 의존성(devDependencies 포함)을 설치합니다.
RUN npm ci

# 2. 빌드 단계 (builder)
FROM node:22-alpine AS builder
WORKDIR /app

# 모든 의존성이 설치된 node_modules를 복사합니다.
COPY --from=deps /app/node_modules ./node_modules
# 소스 코드를 복사합니다.
COPY . .

# Next.js 앱 빌드
RUN npm run build

# 3. 최종 실행 단계 (runner)
FROM node:22-alpine AS runner
WORKDIR /app

# 보안을 위해 non-root 사용자 생성
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 프로덕션 환경임을 명시 (Next.js 최적화에 중요)
ENV NODE_ENV=production
# Next.js가 기본으로 사용하는 포트
EXPOSE 3000
# 포트 변경이 필요하다면 아래 환경변수 사용
ENV PORT=3000

# 빌드 단계에서 생성된 standalone 폴더 복사
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# 정적 에셋(이미지, 폰트 등) 복사
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 빌드된 정적 파일(.css, .js 등) 복사
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 생성한 non-root 사용자로 전환
USER nextjs

# 애플리케이션 실행
CMD ["node", "server.js"]