<h1 align="center">LuLab Backend</h1>

基于 NestJS 的会议与用户服务后端。提供用户认证（JWT）、验证码（邮箱/短信）、邮件服务、会议记录管理与统计，并集成腾讯会议 Webhook/开放 API 与飞书多维表格（Bitable）同步。数据层使用 Prisma + PostgreSQL。

运行环境：Node.js 18+、pnpm、PostgreSQL。

## 功能特性

- 认证与账户
  - 注册/登录/刷新/登出（JWT），邮箱/短信验证码登录
  - 用户资料获取与更新，登录失败限流与日志
- 验证码与通知
  - 邮箱：SMTP（nodemailer）发送与连通性校验
  - 短信：阿里云短信发送与模板化场景（注册/登录/重置密码）
- 会议管理（Meeting）
  - 会议记录 CRUD、统计、重处理入口
- 集成
  - 腾讯会议：Webhook（URL 校验/事件接收）、开放 API（录制/参会/转写/智能能力）
  - 飞书：多维表格 Bitable 同步（支持 upsert 去重）

## 技术栈

- NestJS + TypeScript
- Prisma ORM + PostgreSQL
- Swagger 文档（`/api`）
- Jest + Supertest（unit/integration/e2e）

## 项目结构（节选）

- `src/auth`
  - `controllers`：`auth.controller.ts`
  - `services`：已按用例拆分
    - `register.service.ts`、`login.service.ts`、`password.service.ts`、`profile.service.ts`
    - `token.service.ts`、`auth-policy.service.ts`
    - `utils/`：`user-mapper.ts`、`password.util.ts`
  - `repositories`：`user.repository.ts`、`login-log.repository.ts`
  - `enums`：`auth-type.enum.ts`、`login-type.enum.ts`、`verification-type.enum.ts`（统一由 `index.ts` 导出）
- `src/verification`：验证码控制器/服务、`enums`（`index.ts` 汇总）
- `src/meeting`：会议业务模块
- `src/tencent-meeting`：腾讯会议 Webhook 与业务对接
- `src/feishu-meeting`：飞书 Webhook 骨架
- `libs/`：第三方平台集成与共享库
- `prisma/`：`schema.prisma`、migrations、`seed`
- `test/`：unit/integration/system/e2e

路径别名：`@/` → `src`，`@libs/` → `libs`。

## 快速开始

1) 安装依赖

```bash
pnpm install
```

2) 配置环境变量

复制 `.env.example` 为 `.env`，并按环境补充：

- 数据库：`DATABASE_URL`
- JWT：`JWT_SECRET`、`JWT_REFRESH_SECRET`、`JWT_EXPIRES_IN`、`JWT_REFRESH_EXPIRES_IN`
- 邮件：`SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、`SMTP_PASS`、`SMTP_FROM`
- 短信：`ALIBABA_CLOUD_ACCESS_KEY_ID`、`ALIBABA_CLOUD_ACCESS_KEY_SECRET`、`ALIYUN_SMS_SIGN_NAME`、模板变量
- 腾讯会议：`TENCENT_MEETING_*`（APP/SDK/SecretId/SecretKey、Webhook Token/EncodingAESKey）
- 飞书：`LARK_APP_ID`、`LARK_APP_SECRET`、`LARK_BITABLE_*`

3) 初始化数据库

```bash
pnpm db:generate
pnpm db:push      # 或 pnpm db:migrate
pnpm db:seed      # 可选
```

4) 启动服务

```bash
pnpm start:dev    # 开发
pnpm build && pnpm start:prod
```

启动后：

- 应用：`http://localhost:3000`
- Swagger：`http://localhost:3000/api`

## 常用脚本

```bash
# 质量
pnpm lint
pnpm format

# 构建/运行
pnpm build
pnpm start:dev
pnpm start:prod

# 测试
pnpm test            # unit
pnpm test:e2e
pnpm test:integration
pnpm test:cov
pnpm test:all        # unit/integration/system/e2e
pnpm test:ci         # all + coverage

# 数据库
pnpm db:generate
pnpm db:push | db:migrate | db:reset | db:seed | db:drop | db:backup
```

## API 概览（节选）

- 文档：`/api`（需要 BearerAuth 的接口会在文档中标注）

- 认证（`/api/auth`）
  - `POST /register`、`POST /login`、`POST /reset-password`、`POST /refresh-token`、`POST /logout`
- 验证码（`/api/verification`）
  - `POST /send`、`POST /verify`
- 用户（`/api/user`）
  - `GET /profile`、`PUT /profile`
- Webhooks
  - 腾讯会议：`GET /webhooks/tencent`（URL 校验）、`POST /webhooks/tencent`（事件接收）
  - 飞书：`POST /webhooks/feishu`

## 腾讯会议开放 API 提示

- 已封装录制、参会、转写与智能能力等调用
- 腾讯 API 存在调用方 IP 白名单限制，若报错 `500125`，请在腾讯会议后台添加服务器出口 IP

## 开发与规范

- 代码风格：Prettier（2 空格、singleQuote、trailingComma: all）、ESLint with @typescript-eslint
- 文件命名：kebab-case；类/接口：PascalCase；变量：camelCase
- 测试：Jest，约定路径
  - unit：`src/**/*.spec.ts`
  - integration：`test/integration/**/*.int-spec.ts`
  - e2e：`test/e2e/**/*.e2e-spec.ts`
  - system：`test/system/**/*.spec.ts`
- 覆盖率：unit 全局阈值 ≥ 80%
- 提交信息：Conventional Commits（feat/fix/refactor/test/chore）

## 安全与部署建议

- 切勿提交 `.env`；基于 `.env.example` 新增配置
- 生产环境务必更换并管理好 `JWT_*` 与第三方 Secret
- 腾讯会议开放 API 建议配置服务器出口 IP 白名单

## 许可

UNLICENSED（私有项目）。

—— 如需补充飞书 Webhook 的签名校验与完整事件处理，或添加新的会议平台接入，请创建 Issue/任务讨论与排期。
