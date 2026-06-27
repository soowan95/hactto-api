# hactto-api

hactto 플랫폼의 로또 번호 분석 및 신뢰도 통계 연산을 담당하는 NestJS 기반 백엔드 API 서버입니다.

## 🛠 Tech Stack
- **Framework**: NestJS (TypeScript)
- **ORM**: Prisma (MariaDB)
- **Cache / Session**: Redis
- **Documentation**: Swagger API
- **Testing**: Jest (Unit & CQRS Tests)

## 🔑 Core Features
1. **IP 기반 접근 제어 (Access Control)**:
   - 인가된 IP만 화이트리스트(`allowed:ips`)에 등록해 접근을 허용합니다.
   - 쿠키 세션 토큰(`allowed_token`)을 검증하여 유효할 시 자동으로 신규 IP를 화이트리스트에 갱신합니다.
2. **분석 알고리즘 엔진**:
   - 역대 로또 당첨 데이터 기반의 확률 통계 연산 및 당첨 번호 추천 알고리즘을 수행합니다.
3. **알고리즘 신뢰도 시뮬레이터**:
   - 과거 회차 데이터 대조 테스트를 통해 번호 조합의 수학적 신뢰도 및 점수를 측정합니다.

## 🚀 Getting Started

### Prerequisites
로컬 개발 환경에 Docker 및 Docker Compose가 설치되어 있어야 합니다.

### 1. 로컬 환경 배포 및 실행 (Docker Compose)
백엔드 API 서버 및 MySQL, Redis 서비스를 일괄 가동합니다. 실행 시 소스 코드가 함께 빌드되어 가동됩니다.
```bash
# 실행 권한 부여 후 스크립트 실행
chmod +x cmd/localhost/deploy.sh
./cmd/localhost/deploy.sh
```

### 2. 환경 변수 설정
로컬 구동을 위한 기본 환경 설정 정보는 `.env.localhost` 파일에 기재되어 있으며, 컨테이너 기동 시 자동으로 마운트됩니다.

### 3. API 문서 확인 (Swagger)
로컬 컨테이너 가동 후 아래 주소로 접속하여 API 명세 확인 및 테스트를 진행할 수 있습니다.
- **Swagger URL**: `http://localhost:3000/swagger`

---

## 🧪 Testing Guide

테스트 코드는 루트 디렉터리의 `test/` 폴더 내에 **Bounded Context(BC)**별로 구분하여 체계적으로 관리되고 있습니다.

```bash
test/
├── helpers/             # Redis 서비스 및 컨트롤러 검증
├── lottery-analysis/    # 알고리즘 기반 생성 및 분석 컨트롤러 검증
├── manager/             # 공지사항 생성/조회 및 IP 차단 검증
└── number/              # 로또 회차/당첨번호 CQRS 핸들러 검증
```

### 테스트 실행 명령어
```bash
# 전체 테스트 실행
npm run test

# 린터 검사
npm run lint
```
