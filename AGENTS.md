# Repository Guidelines

A concise guide for contributors working in this NestJS monorepo. Follow these conventions to keep the project consistent and CI green.

## Project Structure & Module Organization
- `src/` Nest modules (controllers/services/guards). Examples: `src/auth/*`, `src/meeting/*`, `src/tencent-meeting/*`.
- `libs/` Shared libraries (e.g., Lark integrations).
- `prisma/` Schema, migrations, seeds: `schema.prisma`, `seeds/`.
- `test/` Jest projects: `unit/`, `integration/`, `system/`, `e2e/` plus helpers/fixtures.
- `docs/` documentation; `dist/` build output; `scripts/` utilities.

## Build, Test, and Development Commands
- `pnpm start:dev` Run local dev server with watch.
- `pnpm build` Compile TypeScript to `dist/`.
- `pnpm start:prod` Run compiled app (`node dist/main`).
- `pnpm lint` ESLint + auto-fix; `pnpm format` Prettier write.
- `pnpm test` Unit tests; `pnpm test:e2e`, `pnpm test:integration`, `pnpm test:system` for suites.
- `pnpm test:cov` Coverage; `pnpm test:all` all projects; `pnpm test:ci` all + coverage.
- Prisma/DB: `pnpm db:generate`, `pnpm db:push|migrate|reset|seed|drop|backup`.

## Coding Style & Naming Conventions
- Language: TypeScript. Indent: 2 spaces. Prettier: `singleQuote: true`, `trailingComma: all`.
- Linting: ESLint with `@typescript-eslint` and Prettier integration.
- Filenames: kebab-case. Classes/Interfaces: PascalCase. Variables: camelCase.
- Suffixes: DTO `*.dto.ts`, Exception `*.exception.ts`, Decorator `*.decorator.ts`, Types `*.types.ts`.
- Path aliases: `@/` → `src`, `@libs/` → `libs`.

## Testing Guidelines
- Framework: Jest; Supertest for e2e. Multi-project config in `jest.config.ts`.
- Naming: unit `src/**/*.spec.ts`; integration `test/integration/**/*.int-spec.ts`; e2e `test/e2e/**/*.e2e-spec.ts`; system `test/system/**/*.spec.ts`.
- Coverage: unit global threshold ≥ 80% branches/functions/lines/statements.
- Run locally before PR: `pnpm lint && pnpm test:all` (or `pnpm test:ci`).

## Commit & Pull Request Guidelines
- Commits: Conventional Commits, e.g., `feat(auth): add refresh token`, `fix(meeting): ...`, `chore: ...`.
- PRs: clear description; scope (auth/meeting/lark/etc.); link issue; include DB changes (migrations) and any new `.env` keys; attach logs or Swagger screenshots for API changes; ensure CI passes (lint, tests, coverage).

## Security & Configuration Tips
- Never commit `.env`. Base on `.env.example`; document new keys.
- Initialize DB: `pnpm db:generate && pnpm db:push && pnpm db:seed` (seed optional).
- Rotate `JWT_*` and third‑party secrets in production; restrict Tencent API IP allowlist as required.
