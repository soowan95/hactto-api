# Hactto API Development & Deployment Guide

## API Execution / Deploy
API 실행 및 로컬 배포는 항상 아래 스크립트를 사용하여 도커 컨테이너를 빌드하고 실행해야 합니다:
```bash
./cmd/localhost/deploy.sh
```

## Prisma Migrations & Client Generation
- 로컬 DB 마이그레이션 실행:
  ```bash
  ./cmd/localhost/migrate-dev.sh
  ```
- Prisma 클라이언트 재생성:
  ```bash
  ./cmd/localhost/generate.sh
  ```

## Build
- 로컬 TypeScript 빌드 테스트:
  ```bash
  npm run build
  ```
