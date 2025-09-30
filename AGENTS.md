# Repository Guidelines

## Project Structure & Module Organization
- Keep feature code under `src/` by domain (e.g., `src/auth`, `src/tencent-meeting`) so controllers, services, and guards stay co-located.
- Place reusable integrations and utilities in `libs/` and import them with `@libs/` instead of duplicating logic.
- Manage database artifacts in `prisma/` (`schema.prisma`, `migrations/`, `seed.ts`) and mirror test coverage under `test/` (`unit/`, `integration/`, `system/`, `e2e/`).
- Reserve `docs/`, `scripts/`, and `dist/` for documentation, tooling helpers, and build outputs respectively.

## Build, Test, and Development Commands
- `pnpm start:dev` runs the API in watch mode with hot reload; `pnpm start:prod` executes the compiled bundle from `dist/`.
- `pnpm build` transpiles TypeScript; run `pnpm lint` and `pnpm format` before pushing to satisfy ESLint and Prettier.
- Use `pnpm db:generate`, `pnpm db:push`, and `pnpm db:seed` to evolve the Prisma schema and provision data locally.

## Coding Style & Naming Conventions
- Write TypeScript with 2-space indentation, single quotes, and trailing commas; rely on Prettier for formatting.
- Enforce `@typescript-eslint` rules via `pnpm lint`; ensure public APIs expose explicit return types when clarity matters.
- Keep filenames kebab-case, class/interface names PascalCase, and variables camelCase; suffix DTOs, guards, and decorators appropriately.
- Import local modules through `@/` for `src` paths and `@libs/` for shared packages.

## Testing Guidelines
- Jest drives all suites; execute `pnpm test` for unit coverage, `pnpm test:e2e` for end-to-end flows, `pnpm test:integration`, and `pnpm test:system` as needed.
- Follow naming standards: `src/**/*.spec.ts`, `test/integration/**/*.int-spec.ts`, `test/e2e/**/*.e2e-spec.ts`, and `test/system/**/*.spec.ts`.
- Maintain ≥80% coverage across statements, branches, functions, and lines; use `pnpm test:ci` for the full gated pipeline.

## Commit & Pull Request Guidelines
- Use Conventional Commits (e.g., `feat(meeting): enable breakout sessions`, `fix(auth): refresh token expiry`).
- PRs should summarize scope, link issues, note schema or `.env` updates, and attach supporting evidence such as migration diffs or API snapshots.
- Confirm `pnpm lint` and relevant test suites pass before requesting review, and highlight any risk or rollback considerations.

## Security & Configuration Tips
- Never commit secrets; base local configuration on `.env.example` and document new environment keys.
- Rotate `JWT_*` and third-party credentials regularly and restrict Tencent Meeting allowlists to required IP ranges.
- When schema changes occur, run `pnpm db:migrate && pnpm db:seed` to keep local environments aligned.
