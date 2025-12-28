# 腾讯会议集成

腾讯会议集成模块负责与腾讯会议API和Webhook进行交互，实现会议管理和事件处理功能。

## 📚 文档列表

- [腾讯会议集成概述](README.md) - 集成概述和配置
- [API集成](API_INTEGRATION.md) - 腾讯会议API集成实现
- [Webhook处理](WEBHOOK_HANDLING.md) - Webhook事件处理
- [事件示例](EVENT_EXAMPLES.md) - 事件格式和处理示例

## 🔧 配置

腾讯会议集成需要以下环境变量：

```bash
# 腾讯会议API配置
TENCENT_MEETING_APP_ID=your_app_id
TENCENT_MEETING_SDK_ID=your_sdk_id
TENCENT_MEETING_SECRET=your_secret

# Webhook配置
TENCENT_MEETING_WEBHOOK_URL=your_webhook_url
TENCENT_MEETING_WEBHOOK_SECRET=your_webhook_secret
```

## 🏗️ 模块结构

```
src/tencent-meeting/
├── controllers/          # HTTP请求处理器
├── services/            # 业务逻辑服务
├── repositories/        # 数据访问层
├── dto/                 # 数据传输对象
├── types/               # TypeScript类型定义
├── enums/               # 枚举定义
├── exceptions/          # 自定义异常
└── utils/               # 工具函数
```

## 🔄 事件处理流程

1. 接收腾讯会议Webhook事件
2. 验证事件签名
3. 解析事件数据
4. 处理业务逻辑
5. 更新数据库记录
6. 触发后续流程（如通知）

## 📊 事件类型

- 会议开始
- 会议结束
- 参与者加入
- 参与者离开
- 录制完成
- 录制转写完成

## 🧪 测试

腾讯会议集成模块的测试位于 `test/unit/tencent-meeting/` 目录下，包括：
- 单元测试：测试各个服务和控制器
- 集成测试：测试与腾讯会议API的交互
- Webhook测试：测试Webhook事件处理

## 📖 事件示例

事件示例文件位于 `events-json-demo/` 目录下，包含各种事件类型的示例数据。