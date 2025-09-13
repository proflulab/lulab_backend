# 🧪 LULAB 后端测试指南

本目录包含 LULAB 后端服务的完整测试套件，采用分层测试架构设计。

## 📁 目录结构

```text
test/
├── configs/              # 测试配置文件
│   └── test-config.ts    # 集中化测试配置
├── e2e/                  # 端到端测试
│   ├── app.e2e-spec.ts   # 应用基础测试
│   ├── auth.e2e-spec.ts  # 认证流程测试
│   └── tencent-webhook.e2e-spec.ts
├── fixtures/             # 测试数据和工厂
│   ├── test-data.factory.ts  # 测试数据生成器
│   └── mock-services.ts      # 模拟服务
├── helpers/              # 测试辅助工具
│   ├── test-app.helper.ts     # 应用创建助手
│   ├── test-database.helper.ts # 数据库管理
│   └── test-utils.ts          # 通用测试工具
├── integration/          # 集成测试
│   ├── meeting.integration.spec.ts
│   ├── lark.integration.spec.ts
│   └── tencent-meeting.integration.spec.ts
├── mocks/                # 模拟对象（空目录，用于扩展）
├── system/               # 系统测试
│   ├── performance/      # 性能测试
│   ├── scenarios/        # 业务场景测试
│   └── workflows/        # 工作流测试
├── unit/                 # 单元测试
│   ├── auth/
│   ├── meeting/
│   ├── tencent-meeting/
│   └── user/
├── setup.ts              # 基础测试设置
├── setup-integration.ts  # 集成测试设置
├── setup-system.ts       # 系统测试设置
└── teardown.ts           # 测试清理
```

## 🚀 快速开始

### 运行所有测试

```bash
# 运行完整测试套件
./scripts/test-all.sh

# 或
npm run test:all
```

### 运行特定类型测试

```bash
# 单元测试
./scripts/test-all.sh --unit

# 集成测试
./scripts/test-all.sh --integration

# 端到端测试
./scripts/test-all.sh --e2e

# 系统测试
./scripts/test-all.sh --system
```

### 开发模式

```bash
# 监听模式运行单元测试
./scripts/test-all.sh --unit --watch

# 带覆盖率运行
./scripts/test-all.sh --unit --coverage
```

## 🛠️ 测试工具

### 测试数据工厂

使用 `TestDataFactory` 生成一致的测试数据：

```typescript
import { TestDataFactory } from '../fixtures/test-data.factory';

// 生成用户数据
const user = TestDataFactory.createUser({
  email: 'specific@example.com',
  role: 'ADMIN'
});

// 生成会议数据
const meeting = TestDataFactory.createMeeting({
  title: 'Math Class',
  maxParticipants: 50
});
```

### 数据库助手

使用 `TestDatabaseHelper` 管理测试数据库：

```typescript
import { TestDatabaseHelper } from '../helpers/database.helper';

// 清理数据库
beforeEach(async () => {
  await TestDatabaseHelper.cleanDatabase();
});

// 创建测试数据
const user = await TestDatabaseHelper.createTestUser();
const meeting = await TestDatabaseHelper.createTestMeeting(user.id);
```

### 测试工具

使用 `TestUtils` 进行常见验证：

```typescript
import { TestUtils } from '../helpers/test-utils';

// 验证成功响应
TestUtils.expectSuccessResponse(response);

// 验证分页响应
TestUtils.expectPaginatedResponse(response);

// 验证对象结构
TestUtils.expectObjectStructure(user, {
  id: 'string',
  email: 'string',
  profile: {
    name: 'string',
    avatar: 'string'
  }
});
```

## 🧪 测试类型

### 单元测试 (Unit Tests)

- **位置**: `test/unit/`
- **范围**: 单个函数、方法、类
- **特点**: 快速执行，无外部依赖
- **示例**: 服务方法、工具函数、验证器

### 集成测试 (Integration Tests)

- **位置**: `test/integration/`
- **范围**: 多个组件协作
- **特点**: 测试数据库、外部服务模拟
- **示例**: API端点、数据库操作、服务集成

### 端到端测试 (E2E Tests)

- **位置**: `test/e2e/`
- **范围**: 完整用户流程
- **特点**: 真实HTTP请求、完整业务场景
- **示例**: 用户注册、登录、会议创建流程

### 系统测试 (System Tests)

- **位置**: `test/system/`
- **范围**: 系统级功能和性能
- **特点**: 长时间运行、性能指标
- **示例**: 并发测试、负载测试、工作流测试

## 📊 测试配置

### Jest 配置

项目使用多项目Jest配置：

- **单元测试**: `src/**/*.spec.ts`
- **集成测试**: `test/integration/**/*.spec.ts`
- **端到端测试**: `test/e2e/**/*.e2e-spec.ts`
- **系统测试**: `test/system/**/*.spec.ts`

### 环境变量

测试环境使用 `.env.test` 文件：

```bash
# 复制示例文件
cp .env.test.example .env.test

# 编辑配置
nano .env.test
```

## 🔧 开发指南

### 添加新测试

1. **单元测试**

   ```typescript
   // test/unit/[模块]/[service/controller].spec.ts
   describe('YourService', () => {
     // 测试用例
   });
   ```

2. **集成测试**

   ```typescript
   // test/integration/[feature].integration.spec.ts
   describe('Feature Integration Tests', () => {
     // 测试用例
   });
   ```

3. **端到端测试**

   ```typescript
   // test/e2e/[feature].e2e-spec.ts
   describe('Feature E2E Tests', () => {
     // 测试用例
   });
   ```

### 测试数据管理

- 使用 `TestDataFactory` 生成测试数据
- 使用 `TestDatabaseHelper` 管理数据库状态
- 每个测试后清理数据，保持隔离性

### 最佳实践

1. **测试命名**: 使用描述性名称 `should...when...`
2. **测试结构**: Arrange-Act-Assert (AAA) 模式
3. **测试隔离**: 每个测试独立，不依赖执行顺序
4. **错误处理**: 测试异常情况，验证错误消息
5. **性能**: 单元测试 < 1秒，集成测试 < 10秒

## 📈 测试报告

### 覆盖率报告

```bash
# 生成覆盖率报告
./scripts/test-all.sh --coverage

# 查看报告
open coverage/html/index.html
```

### 性能报告

```bash
# 运行性能测试
./scripts/test-all.sh --system

# 查看系统测试报告
open test-reports/system-test-results.html
```

## 🆘 故障排除

### 常见问题

1. **数据库连接失败**

   ```bash
   # 重置测试数据库
   npm run db:test:reset
   ```

2. **端口冲突**

   ```bash
   # 使用不同端口
   PORT=3001 npm run test:e2e
   ```

3. **测试超时**

   ```bash
   # 增加超时时间
   jest.setTimeout(30000);
   ```

### 调试技巧

- 使用 `console.log` 调试测试数据
- 使用 `--verbose` 查看详细输出
- 使用 `--detectOpenHandles` 查找未关闭的连接

## 📞 支持

遇到问题或需要添加新测试类型？请联系开发团队或创建 Issue。
