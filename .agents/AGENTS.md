# Project Rules

## Pull Request Guidelines
- When creating a Release Pull Request from the `dev` branch to the `main` branch, no additional version bump is required (as it should already be updated in `dev`). However, you must explicitly highlight the accumulated version difference between `main` and `dev` (e.g., `1.0.0` ➔ `1.1.0`) in the PR title or description so reviewers can easily trace the release version.

- When creating a Pull Request to the `dev` branch, you must bump the version in `package.json` and run `npm install` before committing.

## Prisma Guidelines
- Do not use `prisma migrate dev` directly. Use `prisma db push` for local development. Migration is done using `.env.migrate.localhost` before merging into the `dev` branch.

- Always write Pull Request titles and bodies in detailed English.

## Git Branch Guidelines
- Branches must be created using the format: `anti/v1/{type:feat|chore|refactor|fix|hotfix}/{description}`

## Pre-PR Requirements
- Always run `npm run lint` and `npm run format` (or equivalent formatting/linting scripts) to ensure code quality before creating a Pull Request.
## Deployment / `main` Branch Guidelines
- **No Direct Pushes**: Never push directly to the `main` branch. All changes to `main` MUST go through a Pull Request from `dev` to prevent unsynced code and pipeline failures.
- **Pre-Deployment Local Verification**: Before triggering any deployment or merging to `main`, you MUST locally verify that the code compiles successfully by running a full build (`npm run build`) and passes all linting (`npm run lint`).
- **Secure Secret Handling in CI/CD**: When modifying GitHub Actions workflows (`.yml`), NEVER use direct string interpolation for secrets (e.g., `echo "${{ secrets.VAR }}"`). ALWAYS pass secrets via `env` variables or Docker BuildKit secrets (`--mount=type=secret`) to prevent Bash syntax injection and runtime crashes.
- **Branch Context Awareness**: When debugging CI/CD pipelines, explicitly verify your current git branch (`git status`) before committing to ensure fixes are applied to the correct branch (e.g., `main`).
