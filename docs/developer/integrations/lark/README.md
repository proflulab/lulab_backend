# 飞书集成

飞书集成模块负责与飞书API和Webhook进行交互，实现多维表格同步和事件处理功能。

## 📚 文档列表

- [飞书集成概述](README.md) - 集成概述和配置
- [多维表格集成](BITABLE_INTEGRATION.md) - 多维表格集成实现
- [Webhook集成](WEBHOOK_INTEGRATION.md) - 飞书Webhook集成
- [批量操作](BATCH_OPERATIONS.md) - 多维表格批量操作
- [测试指南](TESTING_GUIDE.md) - 集成测试指南

## 🔧 配置

飞书集成需要以下环境变量：

```bash
# 飞书应用配置
LARK_APP_ID=your_app_id
LARK_APP_SECRET=your_app_secret

# 多维表格配置
LARK_BITABLE_APP_TOKEN=your_bitable_app_token
LARK_BITABLE_TABLE_ID=your_table_id

# Webhook配置
LARK_WEBHOOK_URL=your_webhook_url
LARK_WEBHOOK_SECRET=your_webhook_secret
```

## 🏗️ 模块结构

```
src/lark/
├── controllers/          # HTTP请求处理器
├── services/            # 业务逻辑服务
├── repositories/        # 数据访问层
├── dto/                 # 数据传输对象
├── types/               # TypeScript类型定义
├── enums/               # 枚举定义
├── exceptions/          # 自定义异常
└── utils/               # 工具函数
```

## 🔄 数据同步流程

1. 接收系统内部事件
2. 转换数据格式
3. 调用飞书API
4. 处理API响应
5. 记录同步结果
6. 处理失败重试

## 📊 多维表格操作

- 单条记录插入/更新
- 批量记录插入/更新
- 记录查询
- 记录删除
- 字段更新

## 🧪 测试

飞书集成模块的测试位于 `test/unit/lark/` 目录下，包括：
- 单元测试：测试各个服务和控制器
- 集成测试：测试与飞书API的交互
- Webhook测试：测试Webhook事件处理
- 性能测试：测试批量操作性能

## 📝 最佳实践

- 实现适当的错误处理和重试机制
- 遵循飞书API的速率限制
- 使用缓存减少API调用
- 记录详细的操作日志
- 定期检查同步状态