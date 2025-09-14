# 项目协作与规范（Monorepo 指南）

本指南汇总了项目结构、开发与测试命令、代码风格、测试约定、提交与 PR 规范，以及安全与配置建议。请在日常开发中遵循本规范，确保一致性与 CI 通过。

## 项目结构与模块组织

- `src/` NestJS 应用模块（controllers/services/guards）。示例：`src/auth/*`、`src/meeting/*`、`src/tencent-meeting/*`。
- `libs/` 共享库（例如：飞书 Lark 集成）。
- `prisma/` 模型与迁移：`schema.prisma`、`migrations/`、`seeds/`。
- `test/` 测试工程：`unit/`、`integration/`、`system/`、`e2e/` 及 helpers/fixtures。
- `docs/` 文档；`dist/` 构建产物；`scripts/` 脚本与工具。

## 构建、测试与开发命令

- 开发：`pnpm start:dev`（watch）
- 构建：`pnpm build`（TypeScript 编译至 `dist/`）
- 运行：`pnpm start:prod`（`node dist/main`）
- 质量：`pnpm lint`（修复）；`pnpm format`（Prettier 写入）
- 测试：`pnpm test`（单元）；`pnpm test:e2e`、`pnpm test:integration`、`pnpm test:system`（其它套件）
- 覆盖率：`pnpm test:cov`；全部：`pnpm test:all`；CI：`pnpm test:ci`
- Prisma/DB：`pnpm db:generate`、`pnpm db:push|migrate|reset|seed|drop|backup`

## 代码风格与命名

- TypeScript；缩进 2 空格（Prettier）
- Prettier：`singleQuote: true`，`trailingComma: all`
- ESLint：`@typescript-eslint` + Prettier
- 文件名：kebab-case；类/接口：PascalCase；变量：camelCase
- 后缀：DTO `*.dto.ts`，异常 `*.exception.ts`，装饰器 `*.decorator.ts`，类型 `*.types.ts`
- 路径别名：`@/` → `src`，`@libs/` → `libs`

## 测试规范

- 框架：Jest（e2e 使用 Supertest）
- 多项目配置：见根 `jest.config.ts`
- 约定命名：
  - 单元：`src/**/*.spec.ts`
  - 集成：`test/integration/**/*.int-spec.ts`
  - e2e：`test/e2e/**/*.e2e-spec.ts`
  - 系统：`test/system/**/*.spec.ts`
- 覆盖率（单元）全局阈值 ≥ 80%（branches/functions/lines/statements）
- 本地提交前：`pnpm lint && pnpm test:all`（或 `pnpm test:ci`）

## 提交与 PR 规范

- Conventional Commits：
  - `feat(scope): message`、`fix(scope): ...`、`refactor: ...`、`test: ...`、`chore: ...`
- PR：
  - 清晰描述与范围（auth/meeting/lark 等），关联 issue
  - 包含 DB 变更（migrations）与新增 `.env` 键值说明
  - 如有 API 变更，附日志片段或 Swagger 截图
  - 确保 CI 通过（lint、tests、coverage）

## 安全与配置建议

- 切勿提交 `.env`；基于 `.env.example` 创建，本地文档化新增键
- 初始化 DB：`pnpm db:generate && pnpm db:push && pnpm db:seed`（可选 seed）
- 生产环境旋转 `JWT_*` 与三方密钥；腾讯会议 API 需要设置 IP 白名单

---

补充建议：

- 为新模块补充 `README.md` 或在 `docs/` 添加对应章节
- 测试如需外部依赖，请优先 mock；保留独立的“真实联调”脚本或文档说明

