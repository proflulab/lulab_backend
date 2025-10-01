# Repository Guidelines

Use this guide to align new contributions with the conventions already in place for the Lulab backend.

## Project Structure & Module Organization
- Keep feature logic grouped by domain inside `src/` (e.g., `src/auth`, `src/meeting`, `src/scheduler`) so controllers, services, and resolvers stay co-located.
- Place reusable adapters in `libs/` and import them via `@libs/...`; keep Prisma schema, migrations, and seeds in `prisma/` and mirror runtime flows with specs in `test/`.
- Reserve `docs/` for references, `scripts/` for tooling, and `dist/` for build artefacts to avoid polluting the source tree.

## Build, Test, and Development Commands
- `pnpm install` prepares dependencies; `pnpm start:dev` launches the Nest API with watch mode, while `pnpm start:prod` runs the compiled bundle.
- `pnpm build` emits TypeScript output; format and lint with `pnpm format` and `pnpm lint` before raising a PR.
- Use `pnpm db:generate`, `pnpm db:push`, and `pnpm db:seed` whenever the Prisma schema evolves.

## Coding Style & Naming Conventions
- Default to 2-space indentation, single quotes, and trailing commas; Prettier and ESLint (`pnpm lint`) enforce the shared ruleset.
- Apply kebab-case for filenames, PascalCase for classes/interfaces, and camelCase for functions and variables; suffix DTOs, guards, and decorators clearly.
- Import modules through `@/` for `src` paths and `@libs/` for shared utilities.

## Testing Guidelines
- Jest covers all suites: run `pnpm test` for units, `pnpm test:integration`, `pnpm test:e2e`, and `pnpm test:system` for broader flows.
- Name specs `src/**/*.spec.ts`, `test/integration/**/*.int-spec.ts`, `test/e2e/**/*.e2e-spec.ts`, and `test/system/**/*.spec.ts`.
- Maintain ≥80% coverage on statements, branches, functions, and lines; use `pnpm test:ci` before significant merges.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat(meeting): enable breakout sessions`, `fix(auth): refresh token expiry`) to highlight scope and impact.
- PR descriptions should link issues, call out schema or `.env` changes, and attach evidence such as migration diffs or API snapshots.
- Verify `pnpm lint`, targeted test suites, and necessary Prisma migrations locally before requesting review.

## Security & Configuration Tips
- Never commit secrets; derive local settings from `.env.example` and document new keys in `docs/`.
- Rotate `JWT_*` and external credentials regularly, and restrict Tencent Meeting allowlists to required IP ranges.
- After schema updates, run `pnpm db:migrate && pnpm db:seed` to re-sync local databases and keep seeds deterministic.
