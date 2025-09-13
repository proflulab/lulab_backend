<h1 align="center">LuLab Backend</h1>

基于 NestJS 的会议数据与用户服务后端。集成腾讯会议 Webhook 与开放 API、飞书多维表格（Bitable）同步，提供用户认证（JWT）、验证码（邮箱/短信）、邮件服务、会议记录的管理与统计，数据层使用 Prisma + PostgreSQL。

> 运行环境：Node.js 18+、pnpm、PostgreSQL。

## 功能特性

- 用户认证与资料
  - 注册/登录/刷新/登出（JWT），验证码登录（邮箱/短信）
  - 用户资料获取/更新，登录日志记录
- 邮件与短信
  - SMTP 邮件发送与连接校验（nodemailer）
  - 阿里云短信验证码发送（支持注册/登录/重置密码场景）
- 会议管理（Meeting）
  - 会议记录列表/详情/创建/更新/删除、统计、重新处理
- 腾讯会议集成（Tencent Meeting）
  - Webhook：URL 校验、事件接收（meeting.started、meeting.end、recording.completed）
  - 开放 API：录制文件详情、参会成员、转写、智能纪要/总结/话题
- 飞书集成（Lark/Feishu）
  - 多维表格 Bitable 同步会议与参会用户信息（支持 upsert 去重）

## 技术栈

- 框架：NestJS (TypeScript)
- 数据：Prisma ORM + PostgreSQL
- 文档：Swagger（/api）
- 测试：Jest、Supertest（含 e2e 与集成测试）

## 目录结构（主要）

- `src/auth` 认证模块（JWT、守卫/策略、短信、验证码流程）
- `src/meeting` 会议业务（控制器/服务/仓储/DTO/异常/工具）
- `src/tencent-meeting` 腾讯会议（Webhook 控制器、事件处理器工厂、API 客户端、加解密/签名）
- `src/feishu-meeting` 飞书 Webhook（控制器与处理器骨架，签名与逻辑待完善）
- `libs/integrations-lark` 飞书多维表格通用库与仓储封装（Meeting、MeetingUser）
- `prisma` Prisma schema、模型拆分与种子数据

## 快速开始

1) 安装依赖

```bash
pnpm install
```

2) 配置环境变量

复制 `.env.example` 为 `.env`，并根据你的环境填写：

- 数据库：`DATABASE_URL`
- JWT：`JWT_SECRET`、`JWT_REFRESH_SECRET`、`JWT_EXPIRES_IN`、`JWT_REFRESH_EXPIRES_IN`
- SMTP 邮件：`SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、`SMTP_PASS`、`SMTP_FROM`
- 阿里云短信：`ALIBABA_CLOUD_ACCESS_KEY_ID`、`ALIBABA_CLOUD_ACCESS_KEY_SECRET`、`ALIYUN_SMS_SIGN_NAME`、模板代码
- 腾讯会议：`TENCENT_MEETING_*`（APP/SDK/SecretId/SecretKey、Webhook Token/EncodingAESKey）
- 飞书 Bitable：`LARK_APP_ID`、`LARK_APP_SECRET`、`LARK_BITABLE_*_ID`

3) 初始化数据库

```bash
pnpm db:generate
pnpm db:push        # 或使用 pnpm db:migrate（有迁移时）
# 可选：
pnpm db:seed        # 初始化种子数据
```

4) 启动服务

```bash
# 开发
pnpm start:dev

# 生产
pnpm build && pnpm start:prod
```

启动后：

- 应用地址：`http://localhost:3000`
- Swagger 文档：`http://localhost:3000/api`

## 常用脚本

```bash
# 代码质量
pnpm lint
pnpm format

# 构建与运行
pnpm build
pnpm start
pnpm start:dev
pnpm start:prod

# 测试
pnpm test           # 单元测试
pnpm test:e2e       # 端到端测试
pnpm test:integration
pnpm test:cov       # 覆盖率

# Prisma / DB
pnpm db:generate
pnpm db:push
pnpm db:migrate
pnpm db:reset
pnpm db:seed
pnpm db:drop
pnpm db:backup
```

## 关键端点概览

- 文档：`/api`（已启用 BearerAuth）

- 认证（`/api/auth`）
  - `POST /register`、`POST /login`、`POST /send-code`、`POST /verify-code`、`POST /reset-password`、`POST /refresh`、`POST /logout`

- 用户（`/api/user`）
  - `GET /profile`、`PUT /profile`

- 会议（`/meetings`）
  - `GET /` 列表，`GET /:id` 详情，`POST /` 创建，`PUT /:id` 更新，`DELETE /:id` 删除
  - 统计、重处理等接口，详见 Swagger

- Webhooks
  - 腾讯会议：`GET /webhooks/tencent`（URL 校验）、`POST /webhooks/tencent`（事件接收）
    - URL 校验（GET）参数位置：`timestamp`、`nonce`、`signature` 在 Header，`check_str` 在 Query
    - 需配置：`TENCENT_MEETING_TOKEN`、`TENCENT_MEETING_ENCODING_AES_KEY`
  - 飞书：`POST /webhooks/feishu`（控制器已就绪，签名校验与业务处理待完善）

## 腾讯会议开放 API

服务内封装了基础 API 调用（`TencentApiService`），包括：

- 录制文件详情：`GET /v1/addresses/{fileId}`
- 账户级录制列表：`GET /v1/corp/records`（时间窗口不超过 31 天）
- 会议详情与参会成员：`/v1/meetings/*`
- 转写与智能能力：`/v1/records/transcripts/details`、`/v1/smart/*`

注意：

- 腾讯 API 对调用方 IP 有白名单限制，若返回错误码 `500125`，请在应用后台添加服务器出口 IP 到白名单。

## 飞书多维表格（Bitable）同步

- 通过 `libs/integrations-lark` 封装：`BitableService` + `MeetingBitableRepository` / `MeetingUserBitableRepository`
- 支持根据关键字段 upsert，避免重复写入
- 需提供 `LARK_APP_ID`、`LARK_APP_SECRET`、`LARK_BITABLE_APP_TOKEN`、相关 Table ID

## 测试

```bash
pnpm test            # 单元测试
pnpm test:e2e        # e2e 测试（包含腾讯会议 Webhook URL 校验用例）
pnpm test:integration
```

e2e 中对加解密/签名模块做了 mock，便于在 CI 或本地快速验证路由行为。

更多测试说明、分层策略与运行方式请见：`test/README.md`

## 安全与配置建议

- 切勿将 `.env` 提交到版本库
- 在生产环境务必更换默认的 `JWT_SECRET` 与刷新密钥
- SMTP/短信等第三方凭据请使用安全方式管理

## 许可

本项目为私有项目（UNLICENSED）。

---

如需帮助或想要我补充飞书 Webhook 的签名校验与事件处理，请在 Issue/任务中提出，我们可以按优先级推进实现。
