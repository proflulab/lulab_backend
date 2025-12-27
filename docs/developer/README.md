# 开发者文档

欢迎来到 LuLab Backend 开发者文档！本文档面向开发团队成员，提供了系统架构、开发指南、集成实现和部署等详细技术文档。

## 文档导航

### 快速开始

如果您是新加入项目的开发人员，建议按以下顺序阅读：

1. [系统架构](architecture/overview.md) - 了解项目整体架构和模块划分
2. [技术栈](architecture/tech-stack.md) - 了解项目使用的技术栈
3. [项目结构](architecture/project-structure.md) - 熟悉项目目录结构
4. [Prisma 配置](setup/database/prisma-setup.md) - 数据库配置指南
5. [部署指南](setup/deployment/guide.md) - 部署流程说明

### 架构设计

- [整体架构](architecture/overview.md) - 系统架构与模块划分
- [技术栈](architecture/tech-stack.md) - 后端核心技术和第三方服务集成
- [数据流设计](architecture/data-flow.md) - 系统数据流和处理逻辑
- [模块设计](architecture/modules.md) - 系统模块划分和职责
- [项目结构](architecture/project-structure.md) - 项目目录结构和组织方式

### 环境搭建

#### 数据库配置
- [Prisma 配置](setup/database/prisma-setup.md) - Prisma ORM 集成和配置
- [数据库规范](setup/database/style-guide.md) - 数据库开发规范
- [种子数据](setup/database/seeds/) - 测试数据种子

#### 部署配置
- [部署概述](setup/deployment/overview.md) - 部署架构和环境说明
- [部署指南](setup/deployment/guide.md) - 生产环境部署指南

### 开发指南

- [Git 协作](development/git-collaboration.md) - Git 工作流和协作规范
- [脚本说明](development/package-scripts.md) - NPM 脚本使用指南
- [安全规范](development/security.md) - 安全开发和最佳实践

### 核心模块

#### 认证模块
- [认证概述](modules/authentication/overview.md) - 认证模块概述
- [注册流程](modules/authentication/registration-flow.md) - 用户注册流程实现
- [登出实现](modules/authentication/logout-implementation.md) - 登出功能实现总结

#### Webhook 处理器
- [腾讯会议 Webhook](modules/webhook-handlers/tencent-meeting.md) - 腾讯会议 Webhook 处理

### 第三方集成

#### 飞书集成
- [飞书集成概述](integrations/lark/overview.md) - 集成概述和配置
- [集成总结](integrations/lark/summary.md) - 集成功能总结
- [多维表格](integrations/lark/bitable/)
  - [批量操作](integrations/lark/bitable/batch-operations.md) - 多维表格批量操作
  - [Upsert 指南](integrations/lark/bitable/upsert-guide.md) - Upsert 操作指南
  - [Upsert 操作](integrations/lark/bitable/upsert-operations.md) - Upsert 操作详情
  - [测试指南](integrations/lark/bitable/testing-guide.md) - 集成测试指南
  - [详细测试指南](integrations/lark/bitable/testing-guide-detailed.md) - 详细测试指南
  - [录制文件表](integrations/lark/bitable/recording-file-table.md) - 录制文件表结构
- [Webhook 集成](integrations/lark/webhook/integration.md) - 飞书 Webhook 集成

#### 腾讯会议集成
- [集成概述](integrations/tencent-meeting/overview.md) - 腾讯会议集成概述
- [Webhook 处理](integrations/tencent-meeting/webhook.md) - Webhook 事件处理
- [事件示例](integrations/tencent-meeting/events/) - 事件格式示例
- [测试脚本](integrations/tencent-meeting/scripts/) - Postman 测试脚本

#### 其他集成
- [阿里云短信](integrations/aliyun/sms-setup.md) - 短信服务集成实现
- [邮件服务](integrations/email/api.md) - 邮件服务 API 文档

### 参考资料

- [版本控制](development/version-control.md) - 版本控制和发布规范

## 快速查找

### 常见任务

- **设置开发环境**: [Prisma 配置](setup/database/prisma-setup.md) + [部署指南](setup/deployment/guide.md)
- **了解系统架构**: [整体架构](architecture/overview.md) + [技术栈](architecture/tech-stack.md)
- **集成第三方服务**: [第三方集成](#第三方集成)
- **数据库操作**: [数据库配置](setup/database/)
- **开发规范**: [Git 协作](development/git-collaboration.md) + [安全规范](development/security.md)

### 按角色查找

- **后端开发**: [架构设计](#架构设计) + [核心模块](#核心模块) + [环境搭建](#环境搭建)
- **集成开发**: [第三方集成](#第三方集成)
- **DevOps 工程师**: [环境搭建](#环境搭建) + [部署指南](setup/deployment/)
- **新成员**: [快速开始](#快速开始)

## 文档贡献

如果您想为开发者文档做出贡献，请遵循以下原则：

- 保持文档的准确性和时效性
- 使用清晰简洁的语言，避免过于技术化的术语
- 为新功能添加相应的文档
- 遵循现有的文档结构和格式规范
- 提供代码示例时，确保代码可以正常运行

## 技术支持

如有问题，请：

1. 查阅相关文档中的"故障排除"部分
2. 在团队沟通渠道中提问
3. 在项目管理工具中创建 Issue，描述现象与日志

---

**提示**: 本文档与代码同步更新，如有不一致之处，请以最新代码为准。
