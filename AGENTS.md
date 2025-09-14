 # Repository Guidelines
 
 A concise guide for contributors working in this NestJS monorepo. Follow these conventions to keep the project consistent and CI green.
 
 ## Project Structure & Module Organization
 - `src/` NestJS app modules (controllers/services/guards). Examples: `src/auth/*`, `src/meeting/*`, `src/tencent-meeting/*`.
 - `libs/` Shared libraries (e.g., Lark integrations).
 - `prisma/` Schema, migrations, and seeds (`schema.prisma`, `seeds/`).
 - `test/` Jest projects: `unit/`, `integration/`, `system/`, `e2e/` plus helpers/fixtures.
 - `docs/` docs; `dist/` build output; `scripts/` utilities.
 
 ## Build, Test, and Development Commands
 - `pnpm start:dev` Run local dev server with watch.
 - `pnpm build` Compile TypeScript to `dist/`.
 - `pnpm start:prod` Run compiled app (`node dist/main`).
 - `pnpm lint` Lint and auto-fix; `pnpm format` Prettier write.
 - `pnpm test` Unit tests; `pnpm test:e2e`, `pnpm test:integration`, `pnpm test:system` for other suites.
 - `pnpm test:cov` Coverage; `pnpm test:all` All projects; `pnpm test:ci` All + coverage.
 - Prisma/DB: `pnpm db:generate`, `pnpm db:push|migrate|reset|seed|drop|backup`.
 
 ## Coding Style & Naming Conventions
 - Language: TypeScript. Indent: 2 spaces (Prettier).
 - Prettier: `singleQuote: true`, `trailingComma: all`. ESLint with `@typescript-eslint` + Prettier.
 - Filenames: kebab-case. Classes/Interfaces: PascalCase. Variables: camelCase.
 - Suffixes: DTO `*.dto.ts`, Exception `*.exception.ts`, Decorator `*.decorator.ts`, Types `*.types.ts`.
 - Path aliases: `@/` → `src`, `@libs/` → `libs`.
 
 ## Testing Guidelines
 - Framework: Jest (+ Supertest for e2e). Config: `jest.config.ts` (multi-project).
 - Naming: unit `src/**/*.spec.ts`; integration `test/integration/**/*.int-spec.ts`; e2e `test/e2e/**/*.e2e-spec.ts`; system `test/system/**/*.spec.ts`.
 - Coverage: unit global threshold ≥ 80% branches/functions/lines/statements.
 - Run locally before PR: `pnpm lint && pnpm test:all` (or `pnpm test:ci`).
 
 ## Commit & Pull Request Guidelines
 - Conventional Commits: `feat(scope): message`, `fix(scope): ...`, `refactor: ...`, `test: ...`, `chore: ...`.
 - PRs: clear description; scope (auth/meeting/lark/etc.); link issue; include DB changes (migrations) and any new `.env` keys; attach logs or Swagger screenshots for API changes when useful; ensure CI passes (lint, tests, coverage).
 
 ## Security & Configuration Tips
 - Never commit `.env`. Base on `.env.example`; document new keys.
 - Initialize DB: `pnpm db:generate && pnpm db:push && pnpm db:seed` (optional seed).
 - Rotate `JWT_*` and third‑party secrets in production; restrict Tencent API IP allowlist as required.
