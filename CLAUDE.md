# Antigravity Agent Guidelines & Rules

This project uses persistent workspace directives. Antigravity and all subsequent AI assistants MUST read and obey these rules automatically without waiting for explicit user prompts.

## 1. 기획/작업 내용 자동 문서화 규약 (MANDATORY)
* **대화 정리 자동화**: 매 대화 세션이 마무리되거나 주요 기획/설계/개발 변경사항이 발생할 때, 에이전트는 기획 내용과 아키텍처 사양을 반드시 `docs/antigravity/YYYY-MM-DD/{기능명}.md` 파일로 작성하여 문서화 저장소에 보관해야 합니다.
* **사용자 요청 생략**: 사용자가 이 지침을 매번 상기시키거나 지시하지 않도록, 에이전트가 스스로 판단하여 매 대화 종료 전 또는 주요 마일스톤 도달 시 정리를 자동 수행하십시오.

## 2. 로컬 실행 및 배포 규약
* **백엔드 (hactto-api) 실행**: API 서버의 구동은 직접 `docker compose` 또는 네이티브 NestJS 명령어를 직접 호출하지 마십시오. 반드시 백엔드 프로젝트 루트 하위의 `cmd/localhost/deploy.sh` 쉘 스크립트를 권한 부여(`chmod +x`) 후 호출하여 실행해야 합니다.
* **프론트엔드 (hactto-client) 실행**: 프론트엔드 Vite 서버 기동 시 `npm run dev` 명령어를 사용하여 실행하십시오.
