# 测试配置指南

## 概述

本项目采用统一的Jest配置文件 `jest.config.ts`，使用 `projects` 配置来管理不同层级的测试。这种配置方式具有以下优势：

- **单一配置源**：所有测试配置集中在 `jest.config.ts` 中
- **DRY原则**：避免重复配置，共享通用设置
- **现代化**：使用TypeScript和最新的Jest特性
- **灵活性**：每个项目可以独立配置，同时继承通用设置

## 项目结构

```text
test/
├── unit/                    # 单元测试
├── integration/             # 集成测试
├── system/                  # 系统测试
├── e2e/                     # 端到端测试
├── helpers/                 # 测试辅助工具
├── mocks/                   # 测试mock数据
└── configs/                 # 测试配置文件
```

## 配置详解

### jest.config.ts

```typescript
projects: [
  {
    displayName: 'unit',
    // 单元测试配置
  },
  {
    displayName: 'integration', 
    // 集成测试配置
  },
  {
    displayName: 'system',
    // 系统测试配置
  },
  {
    displayName: 'e2e',
    // 端到端测试配置
  }
]
```

### 通用配置继承

所有项目继承以下通用配置：

- TypeScript支持（ts-jest）
- Node.js测试环境
- 路径映射（@/*, @libs/*）
- 代码覆盖率收集规则

## 运行测试

### 运行特定类型测试

```bash
# 单元测试
npm run test:unit

# 集成测试
npm run test:integration

# 系统测试
npm run test:system

# 端到端测试
npm run test:e2e
```

### 运行所有测试

```bash
# 运行所有测试类型
npm run test:all

# CI环境运行
npm run test:ci
```

### 使用Jest CLI

```bash
# 运行特定项目
jest --selectProjects unit
jest --selectProjects unit,integration

# 监听模式
jest --selectProjects unit --watch

# 生成覆盖率报告
jest --selectProjects unit --coverage
```

## 测试分层策略

### 单元测试 (unit)

- **位置**: `src/**/*.spec.ts`
- **目的**: 测试单个函数、类、组件
- **特点**: 快速、隔离、无外部依赖
- **覆盖率要求**: 80%以上

### 集成测试 (integration)

- **位置**: `test/integration/**/*.spec.ts`
- **目的**: 测试模块间的集成
- **特点**: 测试数据库、外部服务集成
- **超时**: 60秒

### 系统测试 (system)

- **位置**: `test/system/**/*.spec.ts`
- **目的**: 测试完整业务流程
- **特点**: 端到端场景、并发测试
- **超时**: 120秒

### 端到端测试 (e2e)

- **位置**: `test/e2e/**/*.e2e-spec.ts`
- **目的**: 测试整个应用
- **特点**: 完整HTTP请求测试

## 环境变量

测试环境使用 `.env.test` 文件配置：

```bash
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/lulab_test"

# Redis
REDIS_URL="redis://localhost:6379"

# 外部服务
TENCENT_SECRET_ID=your_secret_id
TENCENT_SECRET_KEY=your_secret_key
```

## 最佳实践

1. **测试命名**: 使用 `.spec.ts` 或 `.e2e-spec.ts` 后缀
2. **测试结构**: 遵循 Arrange-Act-Assert 模式
3. **Mock策略**: 外部服务使用mock，数据库使用testcontainers
4. **测试数据**: 使用Builder模式创建测试数据
5. **并行执行**: 不同项目测试可以并行运行

## 迁移指南

从旧的多文件配置迁移到新的统一配置：

1. 删除旧的 `jest-*.json` 文件
2. 使用 `jest.config.ts` 统一管理
3. 更新测试脚本使用 `--selectProjects`
4. 验证所有测试类型正常工作

## 故障排除

### 常见问题

1. **配置冲突**: 确保package.json中没有jest配置
2. **类型错误**: 使用 `Partial<Config>` 避免TypeScript错误
3. **路径问题**: 检查moduleNameMapper配置
4. **超时设置**: 在setup文件中设置jest.setTimeout()

### 调试技巧

```bash
# 查看完整配置
jest --showConfig

# 调试特定测试
jest --selectProjects unit --verbose

# 检查测试文件匹配
jest --listTests --selectProjects unit
```
