# 빌드 단계
FROM node:22-alpine AS build
# 작업 디렉토리 설정
WORKDIR /app
# 의존성 파일을 컨테이너로 복사
COPY package*.json ./
# 의존성 설치
RUN npm install
# 애플리케이션 소스 코드를 컨테이너로 복사
COPY . .
# 애플리케이션 빌드
RUN npm run build

# 프로덕션 분리하여 빌드(레이어를 분리하여 효율적인 빌드 캐싱을 위함)
FROM nginx:stable-alpine
# nginx 설정 파일 복사
COPY default.conf /etc/nginx/conf.d/default.conf
# 빌드 결과물을 nginx의 기본 HTML 디렉토리로 복사
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]