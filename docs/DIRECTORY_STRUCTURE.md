# 目录结构（项目与文档）

本文档展示代码仓库与文档目录的整体结构，便于快速定位模块与资料。

## 代码仓库结构

```
.
├─ src/
│  ├─ app.module.ts
│  ├─ main.ts
│  ├─ prisma.module.ts
│  ├─ prisma.service.ts
│  ├─ auth/                     # 用户认证模块
│  │  ├─ auth.controller.ts
│  │  ├─ auth.module.ts
│  │  ├─ dto/
│  │  ├─ enums/                 # 统一由 index.ts 导出
│  │  │  ├─ auth-type.enum.ts
│  │  │  ├─ login-type.enum.ts
│  │  │  ├─ verification-type.enum.ts
│  │  │  └─ index.ts
│  │  ├─ repositories/
│  │  │  ├─ login-log.repository.ts
│  │  │  ├─ refresh-token.repository.ts
│  │  │  └─ user.repository.ts
│  │  ├─ services/
│  │  │  ├─ auth-policy.service.ts
│  │  │  ├─ jwt-user-lookup.service.ts
│  │  │  ├─ login.service.ts
│  │  │  ├─ password.service.ts
│  │  │  ├─ profile.service.ts
│  │  │  ├─ register.service.ts
│  │  │  ├─ token-blacklist.service.ts
│  │  │  ├─ token.service.ts
│  │  │  └─ utils/              # 工具类
│  │  ├─ types/
│  │  └─ decorators/
│  ├─ verification/              # 验证码服务
│  │  ├─ verification.controller.ts
│  │  ├─ verification.module.ts
│  │  ├─ verification.service.ts
│  │  ├─ dto/
│  │  ├─ enums/
│  │  └─ repositories/
│  ├─ meeting/                  # 会议管理模块
│  │  ├─ meeting.controller.ts
│  │  ├─ meeting.module.ts
│  │  ├─ meeting.service.ts
│  │  ├─ dto/
│  │  ├─ exceptions/
│  │  ├─ repositories/
│  │  ├─ types/
│  │  ├─ utils/
│  │  └─ decorators/
│  ├─ tencent-meeting/          # 腾讯会议集成模块
│  │  ├─ controllers/
│  │  │  ├─ tencent-meeting.controller.ts
│  │  │  └─ tencent-webhook.controller.ts
│  │  ├─ services/
│  │  │  ├─ event-handlers/     # 事件处理器
│  │  │  ├─ tencent-meeting.service.ts
│  │  │  ├─ tencent-event-handler.service.ts
│  │  │  └─ tencent-config.service.ts
│  │  ├─ dto/
│  │  ├─ types/
│  │  ├─ interceptors/
│  │  ├─ decorators/
│  │  └─ tencent-meeting.module.ts
│  ├─ lark-meeting/             # 飞书会议模块
│  │  ├─ lark-meeting.module.ts
│  │  ├─ lark-webhook.controller.ts
│  │  └─ lark-webhook.service.ts
│  ├─ user/                     # 用户管理模块
│  │  ├─ user.controller.ts
│  │  ├─ user.module.ts
│  │  ├─ user.service.ts
│  │  └─ decorators/
│  ├─ email/                    # 邮件服务模块
│  │  ├─ email.controller.ts
│  │  ├─ email.module.ts
│  │  ├─ email.service.ts
│  │  └─ dto/
│  ├─ integrations/             # 第三方集成服务
│  │  ├─ index.ts
│  │  ├─ aliyun/               # 阿里云服务集成
│  │  │  ├─ aliyun-sms.service.ts
│  │  │  ├─ aliyun.module.ts
│  │  │  ├─ config/
│  │  │  └─ index.ts
│  │  ├─ email/                # 邮件集成服务
│  │  │  ├─ email.module.ts
│  │  │  ├─ mailer.service.ts
│  │  │  └─ index.ts
│  │  ├─ lark/                 # 飞书集成服务
│  │  │  ├─ lark.client.ts
│  │  │  ├─ lark.module.ts
│  │  │  ├─ config/
│  │  │  ├─ exceptions/
│  │  │  ├─ repositories/
│  │  │  ├─ services/
│  │  │  ├─ types/
│  │  │  ├─ validators/
│  │  │  └─ index.ts
│  │  └─ tencent-meeting/      # 腾讯会议集成服务
│  │     ├─ tencent-api.service.ts
│  │     ├─ tencent.module.ts
│  │     ├─ crypto.util.ts
│  │     ├─ types.ts
│  │     ├─ exceptions.ts
│  │     └─ index.ts
│  ├─ security/                 # 安全相关
│  │  ├─ decorators/
│  │  ├─ jwt/
│  │  ├─ index.ts
│  │  └─ types.ts
│  ├─ redis/                    # Redis 服务
│  │  ├─ redis.module.ts
│  │  └─ redis.service.ts
│  ├─ common/                   # 公共模块
│  │  ├─ email-templates/
│  │  ├─ enums/
│  │  ├─ utils/
│  │  └─ index.ts
│  ├─ app.controller.ts
│  ├─ app.service.ts
│  └─ app.resolver.ts           # GraphQL 解析器
│
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  ├─ seeds/                    # 种子数据文件
│  └─ seed.ts
│
├─ test/
│  ├─ configs/                  # 测试配置
│  ├─ e2e/                      # 端到端测试
│  ├─ fixtures/                 # 测试数据和模拟服务
│  ├─ helpers/                  # 测试辅助工具
│  ├─ integration/              # 集成测试
│  ├─ setup-integration.ts
│  ├─ setup-system.ts
│  └─ README.md
│
├─ scripts/                     # 脚本工具
│  ├─ backup.sh
│  ├─ test-all.sh
│  └─ test-e2e.sh
├─ docs/                        # 项目文档
└─ package.json
```

路径别名：`@/` → `src`。

**重要说明**：项目中的第三方集成服务位于 `src/integrations/` 目录，而非 `libs/` 目录。这些集成包括：
- `src/integrations/lark/`：飞书 Bitable 和 SDK 集成
- `src/integrations/tencent-meeting/`：腾讯会议 API 集成
- `src/integrations/aliyun/`：阿里云短信服务集成
- `src/integrations/email/`：邮件服务集成

## 文档目录结构（docs/）

```
docs/
├─ README.md                     # 文档统一入口与导航（含快捷导航）
├─ ARCHITECTURE.md               # 系统架构与模块划分
├─ API_DOCUMENTATION.md          # API 概览与示例
├─ DEPLOYMENT.md                 # 部署与环境
├─ PROJECT_GUIDELINES.md         # 项目规范与协作
├─ PRISMA_SETUP.md               # 数据库初始化与管理
├─ EMAIL_API.md                  # 邮件服务
├─ ALIYUN_SMS_SETUP.md           # 阿里云短信
├─ REGISTRATION_FLOW.md          # 注册流程说明
├─ TENCENT_MEETING_INTEGRATION.md
├─ TENCENT_MEETING_WEBHOOK.md
├─ LARK_WEBHOOK_INTEGRATION.md
├─ LARK_INTEGRATION.md
├─ LARK_INTEGRATION_SUMMARY.md
├─ LARK_BITABLE_BATCH_OPERATIONS.md
├─ LARK_BITABLE_UPSERT_OPERATIONS.md
├─ LARK_BITABLE_TESTING_GUIDE.md
├─ BITABLE_SERVICE_TESTING.md
├─ RECORDING_FILE_TABLE.md
└─ tencent-meeting-events/
   └─ demo.json                  # 事件示例（较大）
```

## 关键设计要点

### 模块化组织
- **业务模块**：`auth/`, `meeting/`, `user/`, `verification/`, `email/` 负责具体业务逻辑
- **平台集成模块**：`tencent-meeting/`, `lark-meeting/` 处理外部平台的 Webhook 和业务集成
- **集成服务**：`src/integrations/` 提供对第三方 API 的封装和抽象

### 服务分层
- **Controller**：处理 HTTP 请求和响应
- **Service**：业务逻辑处理
- **Repository**：数据访问层
- **Integration**：第三方服务集成层

## 查阅建议
- 总览/运行：根 `README.md`
- 架构/模块：`docs/ARCHITECTURE.md`
- 目录结构：本页 `docs/DIRECTORY_STRUCTURE.md`
- 集成指南（腾讯/飞书）：对应 `docs/*INTEGRATION*.md`
- API 使用：`docs/API_DOCUMENTATION.md` + Swagger `/api`
- 规范与测试：`docs/PROJECT_GUIDELINES.md` 与 `test/README.md`
