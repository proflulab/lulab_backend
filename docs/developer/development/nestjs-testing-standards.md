# NestJS 测试规范（Unit / Integration / System / E2E）

## 1. 目标与原则

### 目标
- 用最小成本获得最大信心：越靠近业务核心的逻辑越需要高覆盖、快反馈的测试。
- 明确分层：不同测试类型解决不同风险，避免“全靠 E2E”或“只有 Unit”。

### 基本原则
- **可重复**：测试不依赖随机、时间、外部网络（除非明确为 E2E/System）。
- **可定位**：失败能快速定位到模块与原因。
- **可维护**：测试结构与命名一致，避免过度耦合实现细节。
- **快慢分离**：Unit 极快；Integration 次之；System/E2E 稳定优先。

---

## 2. 测试分层定义

| 类型 | 目的 | 依赖 | 速度 | 覆盖重点 |
|---|---|---|---|---|
| Unit | 验证单个类/函数逻辑 | Mock 外部依赖 | 极快 | Service、UseCase、Util |
| Integration | 验证模块协作 | 真实 DB/Redis 等 | 中 | Repository、Module wiring |
| System | 验证系统级业务链路 | 多组件一起跑 | 慢 | 核心业务流程、幂等 |
| E2E | 验证对外 API 行为 | HTTP + 全量依赖 | 最慢 | Controller、鉴权、契约 |

---

## 3. 技术栈约定

- 测试框架：Jest
- HTTP 测试：supertest
- 容器依赖：Testcontainers / docker compose
- Mock：jest.mock / 手写 stub
- 覆盖率：jest --coverage

---

## 4. 目录结构

```
src/
test/
  unit/
    *.spec.ts
  integration/
    *.int-spec.ts
  system/
    *.sys-spec.ts
  e2e/
    *.e2e-spec.ts
```

---

## 5. Unit 测试规范

### 范围
- Service / UseCase（强制）
- Util、Pipe、Guard（推荐）

### 规则
- 不访问真实 DB / Redis / 网络
- 只测试行为，不测试实现细节
- Mock 依赖必须显式声明

### 示例
```ts
describe('UserService (unit)', () => {
  it('should throw when user not found', async () => {
    // Arrange / Act / Assert
  });
});
```

---

## 6. Integration 测试规范

### 范围
- Repository + DB
- Service + DB
- Module 依赖关系

### 规则
- 使用真实基础设施（容器化）
- 不 mock DB
- 每个 suite 独立数据隔离

---

## 7. System 测试规范

### 定义
验证多个内部组件协作完成一条业务链路，例如：
- API + DB + MQ
- 缓存一致性
- 幂等与事务

### 规则
- 用例数量少但关键
- 关注业务结果与副作用
- 明确异步超时与重试

---

## 8. E2E 测试规范

### 范围
- HTTP → Service → DB 的完整路径
- 鉴权、校验、异常映射

### 规则
- 每个接口至少覆盖成功 + 常见失败
- 断言返回状态码与响应结构
- 不断言内部实现

---

## 9. 数据与环境隔离

推荐方案（三选一）：
1. 事务回滚
2. truncate 清表
3. schema / database 重建

要求：
- 不依赖已有数据
- 使用 factory 统一生成测试数据

---

## 10. 覆盖率与 CI 门禁

建议：
- Unit：line ≥ 80%，branch ≥ 70%
- Integration：核心模块必须覆盖
- System/E2E：关键业务链路必须覆盖

CI：
- PR：Unit + Integration
- main/nightly：System + E2E

---

## 11. 用例风格

- 统一 AAA（Arrange / Act / Assert）
- 命名清晰：
  - should <do something> when <condition>

---

## 12. 禁止反模式

- 用 E2E 替代 Unit
- Integration 中大量 mock
- 测试依赖执行顺序
- 依赖真实外部服务
