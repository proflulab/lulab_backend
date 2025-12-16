# 项目文档

欢迎来到 LuLab Backend 项目文档！本文档库提供了项目的全面指南，包括架构、集成、功能模块和部署等信息。

## 📚 文档导航

### 🚀 入门指南
- [系统架构](getting-started/ARCHITECTURE.md) - 系统架构与模块划分

### 🔧 第三方集成
#### 腾讯会议集成
- [腾讯会议集成功能](reference/integrations/tencent-meeting/TENCENT_MEETING_INTEGRATION.md)
- [腾讯会议Webhook](reference/integrations/tencent-meeting/TENCENT_MEETING_WEBHOOK.md)

#### 飞书集成
- [飞书多维表格集成指南](reference/integrations/lark/LARK_INTEGRATION.md)
- [飞书集成完成总结](reference/integrations/lark/LARK_INTEGRATION_SUMMARY.md)
- [飞书Webhook集成指南](reference/integrations/lark/LARK_WEBHOOK_INTEGRATION.md)
- [飞书多维表格批量操作](reference/integrations/lark/LARK_BITABLE_BATCH_OPERATIONS.md)
- [飞书多维表格集成测试指南](reference/integrations/lark/LARK_BITABLE_TESTING_GUIDE.md)
- [飞书多维表格Upsert操作](reference/integrations/lark/LARK_BITABLE_UPSERT_OPERATIONS.md)
- [Bitable服务测试](reference/integrations/lark/BITABLE_SERVICE_TESTING.md)
- [Bitable Upsert指南](reference/integrations/lark/BITABLE_UPSERT_GUIDE.md)
- [录制文件记录表](reference/integrations/lark/RECORDING_FILE_TABLE.md)

#### 其他集成
- [阿里云短信服务配置指南](reference/integrations/aliyun/ALIYUN_SMS_SETUP.md)
- [邮件服务](reference/integrations/email/EMAIL_API.md)

### 🎯 功能模块
#### 认证相关
- [注册流程说明](reference/authentication/REGISTRATION_FLOW.md)
- [登出实现总结](reference/authentication/LOGOUT_IMPLEMENTATION_SUMMARY.md)

### 🏗️ 基础设施
#### 数据库
- [Prisma集成说明](infrastructure/database/PRISMA_SETUP.md)

#### 部署
- [部署与环境](infrastructure/deployment/DEPLOYMENT.md)

### 📖 参考资料
- [源码示例和演示](reference/src/) - 腾讯会议事件示例
- [数据库示例](reference/prisma/) - Prisma数据库示例和风格指南

## 🔍 快速查找

如果您是第一次接触项目，建议按以下顺序阅读：

1. [系统架构](getting-started/ARCHITECTURE.md) - 了解项目整体架构
2. [项目规范与协作](getting-started/PROJECT_GUIDELINES.md) - 熟悉开发规范
3. 根据您的需求，查看对应的集成指南或功能模块文档

## 📞 技术支持

如有问题，请参考对应文档中的"故障排除/注意事项"部分，或在任务/Issue中描述现象与日志。