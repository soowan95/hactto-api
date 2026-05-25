# Antigravity Agent Guidelines & Rules

This project uses persistent workspace directives. Antigravity and all subsequent AI assistants MUST read and obey these rules automatically without waiting for explicit user prompts.

## 1. Documentation Language Constraint (CRITICAL)
* **All generated or modified `.md` files** (such as implementation plans, walkthroughs, task logs, specifications, READMEs, etc.) **MUST be written strictly in KOREAN**.
* Do NOT write markdown files in English under any circumstances, with the sole exception of `CLAUDE.md` itself, which must remain in English for proper agent parsing.

## 2. Automated Session Specification
* **Auto-Documentation**: Whenever a chat session is about to end or a major milestone is completed, the agent must document the planning and architectural changes in `docs/antigravity/YYYY-MM-DD/{feature_name}.md` in Korean.
* **Proactive Behavior**: Do not wait for the user to remind you of this guideline. Perform this documentation automatically.

## 3. Local Deploy & Execution Directives
* **Backend (hactto-api)**: To run the backend locally, DO NOT execute `docker compose` or NestJS start scripts directly. You MUST assign execution permissions (`chmod +x`) and run the script `./cmd/localhost/deploy.sh` from the backend root.
* **Frontend (hactto-client)**: To run the frontend locally, DO NOT execute `npm run dev` directly. You MUST assign execution permissions (`chmod +x`) and run the script `./cmd/localhost/deploy.sh` from the frontend root.

## 4. Git Branching Convention (CRITICAL)
* **Branch Name Format**: All git branch names created for tasks, features, or fixes MUST follow the strict naming convention: `anti/v1/{type}/{branch_name}` (e.g., `anti/v1/feature/manual-approval-ip`, `anti/v1/fix/cors-origin`).

## 5. GitHub CLI (gh) Usage Directive
* When using GitHub CLI (`gh`) for creating/editing Pull Requests, DO NOT run pre-checks such as version checks (`gh --version`) or authentication status checks (`gh auth status`). Execute the target `gh` commands directly.

