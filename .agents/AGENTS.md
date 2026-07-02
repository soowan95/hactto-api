# Project Rules

## Pull Request Guidelines
- When creating a Release Pull Request from the `dev` branch to the `main` branch, you must explicitly highlight the version change of `package.json` (e.g., `1.0.0` ➔ `1.1.0`) in the PR title or description so that reviewers can easily trace the version bump.

## Prisma Guidelines
- Do not use `prisma migrate dev` directly. Use `prisma db push` for local development. Migration is done using `.env.migrate.localhost` before merging into the `dev` branch.

- Always write Pull Request titles and bodies in detailed English.
