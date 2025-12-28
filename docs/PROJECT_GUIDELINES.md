# 项目协作与规范（Monorepo 指南）

本指南汇总了项目结构、开发与测试命令、代码风格、测试约定、提交与 PR 规范，以及安全与配置建议。请在日常开发中遵循本规范，确保一致性与 CI 通过。

## 项目结构与模块组织

- `src/` NestJS 应用模块
  - 业务模块：`auth/`、`meeting/`、`user/`、`verification/`、`email/`
  - 平台集成模块：`tencent-meeting/`、`lark-meeting/`
  - 集成服务：`integrations/`（第三方 API 封装）
  - 公共模块：`common/`、`security/`、`redis/`
- `prisma/` 数据库层：`schema.prisma`、`migrations/`、`seeds/`
- `test/` 测试工程：`unit/`、`integration/`、`system/`、`e2e/` 及 helpers/fixtures
- `docs/` 项目文档；`dist/` 构建产物；`scripts/` 运维脚本
- 路径别名：`@/` → `src/`

## 构建、测试与开发命令

### 开发和构建
- 开发：`pnpm start:dev`（watch模式）
- 调试：`pnpm start:debug`（debug模式）
- 构建：`pnpm build`（TypeScript 编译至 `dist/`）
- 运行：`pnpm start:prod`（生产模式）

### 代码质量
- 格式化：`pnpm format`（Prettier 格式化）
- 检查：`pnpm lint`（ESLint 检查和修复）

### 测试套件
- 单元测试：`pnpm test`、`pnpm test:watch`
- 集成测试：`pnpm test:integration`、`pnpm test:integration:watch`
- 系统测试：`pnpm test:system`、`pnpm test:system:watch`
- 端到端测试：`pnpm test:e2e`
- 全部测试：`pnpm test:all`
- CI测试：`pnpm test:ci`（包含覆盖率）
- 覆盖率：`pnpm test:cov`

### 数据库操作
- 生成客户端：`pnpm db:generate`
- 推送模式：`pnpm db:push`（开发环境）
- 迁移：`pnpm db:migrate`（生产环境）
- 重置：`pnpm db:reset`
- 种子数据：`pnpm db:seed`
- 清理数据：`pnpm db:cleandata`
- 删除数据：`pnpm db:drop`（支持 --force）
- 数据库备份：`pnpm db:backup`

### 特殊工具
- 腾讯API验证：`pnpm validate:tencent-api`

## 代码风格与命名

### TypeScript 规范
- 使用 TypeScript 严格模式
- 避免使用 `any` 类型，优先使用具体类型定义
- 缩进：2空格（Prettier 自动格式化）

### 代码格式化
- Prettier 配置：`singleQuote: true`，`trailingComma: all`
- ESLint：`@typescript-eslint` + `eslint-config-prettier`

### 命名约定
- 文件名：kebab-case（例如：`user-profile.service.ts`）
- 类/接口：PascalCase（例如：`UserService`、`AuthGuard`）
- 变量/方法：camelCase（例如：`getUserById`、`isAuthenticated`）
- 常量：UPPER_SNAKE_CASE（例如：`JWT_SECRET`）

### 文件后缀约定
- DTO：`*.dto.ts`
- 异常：`*.exception.ts`
- 装饰器：`*.decorator.ts`
- 类型定义：`*.types.ts`
- 枚举：`*.enum.ts`
- 配置：`*.config.ts`

### 目录结构约定
- 路径别名：`@/` → `src/`
- 每个模块包含：`controllers/`、`services/`、`dto/`、`types/`、`exceptions/`等

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

### 环境变量管理
- 切勿提交 `.env` 文件；基于 `.env.example` 创建本地配置
- 新增环境变量时，同步更新 `.env.example` 并添加说明

### JWT 令牌安全
- 生产环境必须轮转 `JWT_SECRET` 和 `JWT_REFRESH_SECRET`
- 使用强密码（至少 32 字符的随机字符串）
- 注意令牌过期时间设置

### 第三方服务安全
- 腾讯会议 API 需要设置服务器出口 IP 白名单
- 飞书应用配置需要在企业内部发布
- 阿里云短信服务需要验证签名和模板

### 数据库安全
- 初始化数据库：`pnpm db:generate && pnpm db:push && pnpm db:seed`（可选）
- 生产环境使用强密码和 SSL 连接
- 定期备份数据库：`pnpm db:backup`

---

## 补充建议

### 文档维护
- 为新模块补充相关文档或在 `docs/` 添加对应章节
- API 更改后同步更新 Swagger 注释和文档
- 保持 README.md 与项目实际状态一致

### 测试建议
- 测试如需外部依赖，请优先使用 mock
- 保留独立的“真实联调”脚本或文档说明
- 集成测试应该在 `test/integration/` 目录下

### 性能与监控
- 生产环境需要配置日志监控和性能监控
- 数据库查询需要优化索引和分页
- 缓存策略：使用 Redis 缓存频繁查询的数据

### 新技术特性
- GraphQL 支持：集成 Apollo Server，访问 `/graphql` 端点
- 定时任务：使用 `@nestjs/schedule` 实现 cron 任务
- TypeScript 执行：使用 `tsx` 工具执行 .ts 文件

