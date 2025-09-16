# 目录结构（项目与文档）

本文档展示代码仓库与文档目录的整体结构，便于快速定位模块与资料。

## 代码仓库结构

```
.
├─ src/
│  ├─ app.module.ts
│  ├─ auth/
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
│  │  │  └─ user.repository.ts
│  │  └─ services/
│  │     ├─ auth-policy.service.ts
│  │     ├─ login.service.ts
│  │     ├─ password.service.ts
│  │     ├─ profile.service.ts
│  │     ├─ register.service.ts
│  │     ├─ token.service.ts
│  │     └─ utils/
│  │        ├─ password.util.ts
│  │        └─ user-mapper.ts
│  ├─ verification/
│  │  ├─ verification.controller.ts
│  │  ├─ verification.module.ts
│  │  ├─ verification.service.ts
│  │  ├─ dto/
│  │  └─ enums/
│  │     └─ index.ts            # 导出 code-type.enum.ts
│  ├─ meeting/
│  ├─ tencent-meeting/
│  ├─ lark-meeting/
│  ├─ email/
│  ├─ user/
│  └─ prisma.service.ts
│
├─ libs/
│  └─ integrations/             # 第三方平台集成与共享库
│     ├─ lark/
│     └─ tencent-meeting/
│
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed.ts / seeds/
│
├─ test/
│  ├─ unit/
│  ├─ integration/
│  ├─ system/
│  ├─ e2e/
│  └─ helpers/fixtures/
│
├─ scripts/
├─ docs/
└─ package.json
```

路径别名：`@/` → `src`，`@libs/` → `libs`。

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

## 查阅建议
- 总览/运行：根 `README.md`
- 架构/模块：`docs/ARCHITECTURE.md`
- 目录结构：本页 `docs/DIRECTORY_STRUCTURE.md`
- 集成指南（腾讯/飞书）：对应 `docs/*INTEGRATION*.md`
- API 使用：`docs/API_DOCUMENTATION.md` + Swagger `/api`
- 规范与测试：`docs/PROJECT_GUIDELINES.md` 与 `test/README.md`
