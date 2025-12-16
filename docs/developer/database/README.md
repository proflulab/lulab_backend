# 数据库

数据库模块负责处理所有与数据库相关的操作，包括Prisma ORM配置、迁移管理、查询优化等。

## 📚 文档列表

- [Prisma集成](PRISMA_SETUP.md) - Prisma ORM集成和配置
- [数据库设计](DATABASE_DESIGN.md) - 数据库设计和关系
- [迁移管理](MIGRATION_MANAGEMENT.md) - 数据库迁移管理
- [种子数据](SEED_DATA.md) - 种子数据管理
- [查询优化](QUERY_OPTIMIZATION.md) - 数据库查询优化
- [事务处理](TRANSACTION_HANDLING.md) - 数据库事务处理
- [数据备份](BACKUP_AND_RECOVERY.md) - 数据备份和恢复
- [Prisma风格指南](database-prisma-style-guide.md) - Prisma使用规范

## 🏗️ 数据库架构

```
database/
├── prisma/
│   ├── schema.prisma     # Prisma模式定义
│   ├── migrations/        # 数据库迁移文件
│   └── seed.ts           # 种子数据脚本
├── seeds/                # 种子数据JSON文件
└── scripts/              # 数据库管理脚本
```

## 🔧 配置

数据库连接通过环境变量配置：

```bash
# 数据库连接
DATABASE_URL=postgresql://user:password@localhost:5432/lulab_db

# Prisma配置
PRISMA_GENERATE_DATAPROXY=true
```

## 📊 数据表设计

主要数据表包括：
- users: 用户信息
- meetings: 会议信息
- meeting_records: 会议记录
- verification_codes: 验证码
- user_tokens: 用户令牌
- integration_logs: 集成日志

## 🔄 迁移流程

1. 修改Prisma schema
2. 生成迁移文件：`pnpm db:migrate:dev`
3. 应用迁移：`pnpm db:migrate:deploy`
4. 生成Prisma客户端：`pnpm db:generate`

## 🧪 测试

数据库测试位于 `test/unit/database/` 目录下，包括：
- 单元测试：测试数据访问层
- 集成测试：测试数据库操作
- 性能测试：测试查询性能

## 📈 性能优化

- 合理使用数据库索引
- 优化查询语句
- 实现查询缓存
- 使用连接池
- 定期分析查询性能

## 🛡️ 安全考虑

- 使用参数化查询防止SQL注入
- 限制数据库用户权限
- 敏感数据加密存储
- 定期备份数据
- 监控数据库访问日志