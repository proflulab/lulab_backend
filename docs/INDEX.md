# 项目文档索引和导航指南

## 🎯 概述

本文档为项目所有技术文档的索引和导航指南，帮助开发者快速找到所需的文档资源。

## 📚 文档分类导航

### 1. 核心功能集成

#### 腾讯会议集成
- [腾讯会议集成功能](TENCENT_MEETING_INTEGRATION.md) - 核心集成说明
- [腾讯会议Webhook](TENCENT_MEETING_WEBHOOK.md) - Webhook事件处理
- 相关事件示例文件在 `tencent-meeting-events/` 目录

#### 飞书集成
- [飞书多维表格集成指南](LARK_INTEGRATION.md) - 基础集成配置
- [飞书Webhook集成](FEISHU_WEBHOOK_INTEGRATION.md) - Webhook集成
- [飞书多维表格集成完成总结](LARK_INTEGRATION_SUMMARY.md) - 集成完成说明

### 2. 数据存储和数据库

#### Prisma ORM
- [Prisma设置](PRISMA_SETUP.md) - 数据库配置和使用

#### 飞书多维表格
- [录制文件记录表](RECORDING_FILE_TABLE.md) - 录制文件信息存储
- [批量操作指南](LARK_BITABLE_BATCH_OPERATIONS.md) - 批量操作说明
- [Upsert操作指南](LARK_BITABLE_UPSERT_OPERATIONS.md) - Upsert操作说明
- [测试指南](LARK_BITABLE_TESTING_GUIDE.md) - 测试配置和运行
- [服务测试文档](BITABLE_SERVICE_TESTING.md) - Bitable服务集成测试

### 3. 用户功能

#### 用户注册和认证
- [注册流程](REGISTRATION_FLOW.md) - 用户注册流程说明

#### 通信服务
- [阿里云短信服务设置](ALIYUN_SMS_SETUP.md) - 短信服务配置
- [邮箱API配置](EMAIL_API.md) - 邮件服务集成

## 🔍 按功能模块查找文档

### 会议管理模块
- 腾讯会议集成相关文档
- 会议事件处理
- 会议数据存储

### 用户管理模块
- 注册流程
- 认证授权
- 短信和邮件服务

### 数据存储模块
- Prisma数据库
- 飞书多维表格
- 数据同步和备份

### 集成服务模块
- 第三方API集成
- Webhook处理
- 事件驱动架构

## 🛠 开发和测试文档

### 开发环境
- 各集成服务的配置说明
- 环境变量设置
- 本地开发指南

### 测试文档
- [Bitable服务测试](BITABLE_SERVICE_TESTING.md) - 服务测试配置和运行
- 集成测试指南
- 单元测试说明

### 部署和运维
- 配置管理
- 监控和日志
- 故障排除

## 📖 文档维护

### 文档更新规范
1. 新功能开发时同步创建相关文档
2. 功能变更时及时更新对应文档
3. 保持文档与代码版本一致

### 文档贡献指南
1. 使用Markdown格式编写
2. 遵循统一的文档结构
3. 提供清晰的示例代码
4. 包含常见问题和解决方案

## 🔗 相关资源链接

### 官方文档
- [腾讯会议开放平台](https://cloud.tencent.com/document/product/1095)
- [飞书开放平台](https://open.feishu.cn/)
- [Prisma文档](https://www.prisma.io/docs/)
- [NestJS文档](https://docs.nestjs.com/)

### 工具和资源
- 测试脚本位于 `scripts/` 目录
- 配置验证工具
- 数据迁移工具

## 📞 技术支持和反馈

如需技术支持或发现文档问题，请：
1. 查看相关文档的故障排除部分
2. 检查GitHub Issues
3. 联系项目维护团队