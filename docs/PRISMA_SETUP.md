# Prisma 集成说明

本项目已成功集成 Prisma ORM，提供类型安全的数据库访问。

## 已完成的配置

### 1. 安装的依赖

- `prisma` - Prisma CLI 工具
- `@prisma/client` - Prisma 客户端
- `@nestjs/config` - 环境变量配置

### 2. 数据库配置

- 使用 PostgreSQL 数据库
- 数据库连接配置在 `.env` 文件中
- 数据库 schema 定义在 `prisma/schema.prisma`

### 3. 数据模型

Prisma schema 包含多个模型文件，位于 `prisma/models/` 目录中：

- `auth.prisma` - 认证相关模型
- `channel.prisma` - 渠道相关模型
- `curriculum.prisma` - 课程相关模型
- `department.prisma` - 部门相关模型
- `login.prisma` - 登录相关模型
- `meet.prisma` - 会议相关模型（核心功能）
- `order.prisma` - 订单相关模型
- `organization.prisma` - 组织相关模型
- `permission.prisma` - 权限相关模型
- `product.prisma` - 产品相关模型
- `profile.prisma` - 用户档案相关模型
- `project.prisma` - 项目相关模型
- `refund.prisma` - 退款相关模型
- `relations.prisma` - 关系相关模型
- `role.prisma` - 角色相关模型
- `user.prisma` - 用户相关模型
- `verification.prisma` - 验证相关模型

### 4. NestJS 服务

- `PrismaService` - 数据库连接服务

## 常用 Prisma 命令

### 生成客户端

```bash
npx prisma generate
```

### 创建迁移

```bash
npx prisma migrate dev --name migration_name
```

### 查看数据库

```bash
npx prisma studio
```

### 重置数据库

```bash
npx prisma migrate reset
```

## 开发建议

1. **修改数据模型**：编辑 `prisma/schema.prisma` 文件
2. **应用更改**：运行 `npx prisma migrate dev`
3. **生成客户端**：运行 `npx prisma generate`
4. **类型安全**：使用生成的 Prisma 类型确保类型安全

## 文件结构

```text

src/
├── prisma.service.ts     # Prisma 服务
├── user.service.ts       # 用户业务逻辑
├── user.controller.ts    # 用户控制器
└── app.module.ts         # 主模块

prisma/
├── schema.prisma         # 数据库 schema
└── migrations/           # 数据库迁移文件

generated/
└── prisma/              # 生成的 Prisma 客户端
```

## PostgreSQL 设置

### 本地开发环境设置

1. **安装 PostgreSQL**

   ```bash
   # macOS (使用 Homebrew)
   brew install postgresql
   brew services start postgresql

   # 或使用 Docker
   docker run --name postgres-dev -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
   ```

2. **创建数据库**

   ```bash
   # 连接到 PostgreSQL
   psql -U postgres

   # 创建数据库
   CREATE DATABASE lulab_backend;

   # 退出
   \q
   ```

3. **配置连接字符串**
   在 `.env` 文件中更新 `DATABASE_URL`：

   ```text

   DATABASE_URL="postgresql://postgres:password@localhost:5432/lulab_backend?schema=public"
   ```

4. **运行迁移**

   ```bash
   npx prisma migrate dev --name init
   ```

## 注意事项

- `.env` 文件包含数据库连接信息，不要提交到版本控制
- 确保 PostgreSQL 服务正在运行
- 修改 schema 后记得运行迁移命令
- 生产环境请使用安全的数据库凭据
