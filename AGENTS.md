# Repository Guidelines

This NestJS monorepo underpins multiple meeting and integration services. Use this guide to stay aligned with the core structure, tooling, and review expectations so CI stays green and releases remain predictable.

## Project Structure & Module Organization
- `src/` holds domain modules (controllers, services, guards); keep features isolated by folder such as `src/auth/**` or `src/tencent-meeting/**`.
- `libs/` provides reusable packages, including Lark integrations and shared utilities; prefer publishing cross-cutting logic here instead of duplicating it under `src/`.
- `prisma/` manages database concerns (`schema.prisma`, `migrations/`, `seeds/`), while `test/` mirrors all suites (`unit/`, `integration/`, `system/`, `e2e/`); `docs/`, `scripts/`, and `dist/` round out documentation, tooling, and build outputs.

## Build, Test, and Development Commands
- `pnpm start:dev` launches the API in watch mode; `pnpm start:prod` runs the compiled bundle from `dist/`.
- `pnpm build` transpiles TypeScript; `pnpm lint` and `pnpm format` enforce ESLint and Prettier conventions.
- `pnpm test`, `pnpm test:e2e`, `pnpm test:integration`, and `pnpm test:system` execute targeted suites; `pnpm test:ci` runs everything with coverage. DB workflows rely on `pnpm db:generate`, `pnpm db:push`, `pnpm db:migrate`, and related commands.

## Coding Style & Naming Conventions
- Code in TypeScript with 2-space indentation, `singleQuote: true`, and `trailingComma: all` via Prettier.
- Use ESLint (`@typescript-eslint`) for linting; prefer explicit return types in public APIs when clarity matters.
- Filenames stay kebab-case; classes/interfaces use PascalCase; variables camelCase. Suffix DTOs (`*.dto.ts`), exceptions, decorators, and shared types appropriately. Import with `@/` for `src` and `@libs/` for shared packages.

## Testing Guidelines
- Tests run on Jest with Supertest for e2e flows; configuration lives in `jest.config.ts`.
- Naming: unit `src/**/*.spec.ts`, integration `test/integration/**/*.int-spec.ts`, e2e `test/e2e/**/*.e2e-spec.ts`, system `test/system/**/*.spec.ts`.
- Maintain ≥80% coverage across branches/functions/lines/statements; before pushing, execute `pnpm lint && pnpm test:all` (or `pnpm test:ci`).

## Commit & Pull Request Guidelines
- Follow Conventional Commits such as `feat(meeting): enable breakout sessions` or `fix(auth): refresh token expiry`.
- PRs need scope summaries, linked issues, schema or `.env` updates, and supporting evidence (e.g., migration diff, Swagger screenshot, or logs). Confirm lint, tests, and coverage pass before requesting review.

## Security & Configuration Tips
- Never commit secrets; base local configs on `.env.example` and document new keys.
- Provision databases with `pnpm db:generate && pnpm db:push` and `pnpm db:seed` when sample data helps.
- Rotate `JWT_*` and third-party credentials regularly and restrict Tencent Meeting IP allowlists to required ranges.
