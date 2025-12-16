# 开发者文档

欢迎来到 LuLab Backend 开发者文档！本文档面向开发团队成员，提供了系统架构、开发指南、集成实现和部署等详细技术文档。

## 📚 文档导航

### 🚀 快速入门
如果您是新加入项目的开发人员，建议按以下顺序阅读：

1. [系统架构](getting-started/ARCHITECTURE.md) - 了解项目整体架构和模块划分
2. [开发环境搭建](getting-started/DEVELOPMENT_SETUP.md) - 本地开发环境配置指南
3. [项目规范与协作](getting-started/DEVELOPMENT_GUIDELINES.md) - 熟悉开发规范和协作流程
4. [常用脚本说明](getting-started/PACKAGE_SCRIPTS.md) - NPM 脚本使用指南

### 🏗️ 架构设计
- [系统架构](getting-started/ARCHITECTURE.md) - 系统架构与模块划分
- [设计模式](architecture/DESIGN_PATTERNS.md) - 项目中使用的设计模式
- [数据流设计](architecture/DATA_FLOW.md) - 系统数据流设计

### 🧩 核心模块
#### 认证模块
- [注册流程](modules/authentication/REGISTRATION_FLOW.md) - 用户注册流程实现
- [登录与JWT](modules/authentication/LOGIN_AND_JWT.md) - 登录流程和JWT实现
- [登出实现](modules/authentication/LOGOUT_IMPLEMENTATION_SUMMARY.md) - 登出功能实现总结
- [权限控制](modules/authentication/AUTHORIZATION.md) - 权限控制机制

#### 会议模块
- [会议管理](modules/meeting/MEETING_MANAGEMENT.md) - 会议管理功能实现
- [会议记录](modules/meeting/MEETING_RECORDS.md) - 会议记录处理逻辑

#### 用户模块
- [用户管理](modules/user/USER_MANAGEMENT.md) - 用户管理功能实现
- [用户资料](modules/user/USER_PROFILE.md) - 用户资料管理

### 🔌 第三方集成
#### 腾讯会议集成
- [腾讯会议集成概述](integrations/tencent-meeting/README.md) - 集成概述和配置
- [API集成](integrations/tencent-meeting/API_INTEGRATION.md) - 腾讯会议API集成实现
- [Webhook处理](integrations/tencent-meeting/WEBHOOK_HANDLING.md) - Webhook事件处理
- [事件示例](integrations/tencent-meeting/EVENT_EXAMPLES.md) - 事件格式和处理示例

#### 飞书集成
- [飞书集成概述](integrations/lark/README.md) - 集成概述和配置
- [多维表格集成](integrations/lark/BITABLE_INTEGRATION.md) - 多维表格集成实现
- [Webhook集成](integrations/lark/WEBHOOK_INTEGRATION.md) - 飞书Webhook集成
- [批量操作](integrations/lark/BATCH_OPERATIONS.md) - 多维表格批量操作
- [测试指南](integrations/lark/TESTING_GUIDE.md) - 集成测试指南

#### 其他集成
- [阿里云短信服务](integrations/aliyun/SMS_SERVICE.md) - 短信服务集成实现
- [邮件服务](integrations/email/EMAIL_SERVICE.md) - 邮件服务集成实现

### 🗄️ 数据层
#### 数据库设计
- [Prisma集成](database/PRISMA_SETUP.md) - Prisma ORM集成和配置
- [数据库设计](database/DATABASE_DESIGN.md) - 数据库设计和关系
- [迁移管理](database/MIGRATION_MANAGEMENT.md) - 数据库迁移管理
- [种子数据](database/SEED_DATA.md) - 种子数据管理

#### 数据库操作
- [查询优化](database/QUERY_OPTIMIZATION.md) - 数据库查询优化
- [事务处理](database/TRANSACTION_HANDLING.md) - 数据库事务处理
- [数据备份](database/BACKUP_AND_RECOVERY.md) - 数据备份和恢复

### 🚀 部署与运维
#### 部署
- [部署指南](deployment/DEPLOYMENT.md) - 生产环境部署指南
- [环境配置](deployment/ENVIRONMENT_CONFIG.md) - 环境变量和配置管理
- [容器化部署](deployment/CONTAINER_DEPLOYMENT.md) - Docker容器化部署

#### 监控与日志
- [日志管理](operations/LOGGING.md) - 应用日志管理
- [性能监控](operations/MONITORING.md) - 应用性能监控
- [错误追踪](operations/ERROR_TRACKING.md) - 错误追踪和报警

### 🧪 测试
- [测试策略](testing/TESTING_STRATEGY.md) - 项目测试策略
- [单元测试](testing/UNIT_TESTING.md) - 单元测试指南
- [集成测试](testing/INTEGRATION_TESTING.md) - 集成测试指南
- [端到端测试](testing/E2E_TESTING.md) - 端到端测试指南

### 📚 参考资料
- [API文档](reference/API_DOCUMENTATION.md) - 内部API文档
- [代码示例](reference/CODE_EXAMPLES.md) - 常用代码示例
- [故障排除](reference/TROUBLESHOOTING.md) - 常见问题和解决方案
- [术语表](reference/GLOSSARY.md) - 项目术语表

## 🔍 快速查找

### 常见任务
- **设置开发环境**: [开发环境搭建](getting-started/DEVELOPMENT_SETUP.md)
- **添加新功能**: [开发规范](getting-started/DEVELOPMENT_GUIDELINES.md)
- **集成第三方服务**: [第三方集成](#-第三方集成)
- **数据库操作**: [数据层](#️-数据层)
- **部署应用**: [部署与运维](#-部署与运维)

### 按角色查找
- **后端开发**: [核心模块](#-核心模块) + [数据层](#️-数据层)
- **DevOps工程师**: [部署与运维](#-部署与运维)
- **测试工程师**: [测试](#-测试)
- **全栈开发**: [API文档](reference/API_DOCUMENTATION.md)

## 📝 文档贡献

如果您想为开发者文档做出贡献，请遵循以下原则：
- 保持文档的准确性和时效性
- 使用清晰简洁的语言，避免过于技术化的术语
- 为新功能添加相应的文档
- 遵循现有的文档结构和格式规范
- 提供代码示例时，确保代码可以正常运行

## 📞 技术支持

如有问题，请：
1. 查阅相关文档中的"故障排除"部分
2. 在团队沟通渠道中提问
3. 在项目管理工具中创建Issue，描述现象与日志

---

**提示**: 本文档与代码同步更新，如有不一致之处，请以最新代码为准。