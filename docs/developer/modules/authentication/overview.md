# 认证模块

认证模块负责处理用户注册、登录、权限控制等功能。

## 📚 文档列表

- [注册流程](REGISTRATION_FLOW.md) - 用户注册流程实现
- [登录与JWT](LOGIN_AND_JWT.md) - 登录流程和JWT实现
- [登出实现](LOGOUT_IMPLEMENTATION_SUMMARY.md) - 登出功能实现总结
- [权限控制](AUTHORIZATION.md) - 权限控制机制

## 🏗️ 模块结构

```
src/auth/
├── controllers/          # HTTP请求处理器
├── services/            # 业务逻辑服务
├── repositories/        # 数据访问层
├── dto/                 # 数据传输对象
├── types/               # TypeScript类型定义
├── enums/               # 枚举定义
└── exceptions/          # 自定义异常
```

## 🔐 安全考虑

- 使用强密码哈希算法
- 实现JWT令牌黑名单机制
- 设置合理的令牌过期时间
- 实现登录失败次数限制
- 记录安全相关日志

## 🧪 测试

认证模块的测试位于 `test/unit/auth/` 目录下，包括：
- 单元测试：测试各个服务和控制器
- 集成测试：测试认证流程
- 安全测试：测试各种安全场景