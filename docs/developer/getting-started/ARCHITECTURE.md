# 系统架构设计文档

## 概述

本文档详细描述了项目的系统架构设计，包括整体架构、模块划分、数据流和关键技术选型。

## 整体架构

### 架构图

```text
                    ┌─────────────────────────────────────────────────────────────┐
                    │                    客户端/第三方服务                        │
                    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
                    │  │   Web UI    │  │  移动应用    │  │   第三方API集成       │  │
                    │  └─────────────┘  └─────────────┘  └─────────────────────┘  │
                    └─────────────────────┬───────────────────────────────────────┘
                                          │ HTTPS/WebSocket/Webhook
                    ┌─────────────────────▼───────────────────────────────────────┐
                    │                        API网关                              │
                    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
                    │  │   路由管理    │  │   限流控制    │  │    请求验证         │  │
                    │  └─────────────┘  └─────────────┘  └─────────────────────┘  │
                    └─────────────────────┬───────────────────────────────────────┘
                                          │
                    ┌─────────────────────▼───────────────────────────────────────┐
                    │                     负载均衡器                              │
                    │              (Nginx/HAProxy/ALB)                           │
                    └─────────────────────┬───────────────────────────────────────┘
                                          │
        ┌─────────────────────────────────┼───────────────────────────────────────┐
        │                                 │                                       │
┌───────▼────────┐              ┌────────▼────────┐                     ┌───────▼────────┐
│   应用实例1     │              │   应用实例2      │                     │   应用实例N     │
│   (NestJS)      │              │   (NestJS)      │                     │   (NestJS)      │
│ ┌─────────────┐ │              │ ┌─────────────┐ │                     │ ┌─────────────┐ │
│ │ 认证模块     │ │              │ │ 认证模块     │ │                     │ │ 认证模块     │ │
│ │ 会议模块     │ │              │ │ 会议模块     │ │                     │ │ 会议模块     │ │
│ │ 集成模块     │ │              │ │ 集成模块     │ │                     │ │ 集成模块     │ │
│ │ 业务模块     │ │              │ │ 业务模块     │ │                     │ │ 业务模块     │ │
│ └─────────────┘ │              │ └─────────────┘ │                     │ └─────────────┘ │
└─────────────────┘              └─────────────────┘                     └─────────────────┘
        │                                 │                                       │
        └─────────────────────────────────┼───────────────────────────────────────┘
                                          │
        ┌─────────────────────────────────┼───────────────────────────────────────┐
        │                                 │                                       │
┌───────▼────────┐              ┌────────▼────────┐                     ┌───────▼────────┐
│   PostgreSQL   │              │     Redis       │                     │   对象存储      │
│   主数据库      │              │   缓存/队列      │                     │  (OSS/COS)     │
│                │              │                 │                     │                │
│ ┌─────────────┐ │              │ ┌─────────────┐ │                     │ ┌─────────────┐ │
│ │ 用户数据     │ │              │ │ 会话存储     │ │                     │ │ 录制文件     │ │
│ │ 会议数据     │ │              │ │ 任务队列     │ │                     │ │ 附件文件     │ │
│ │ 业务数据     │ │              │ │ 临时缓存     │ │                     │ │ 静态资源     │ │
│ └─────────────┘ │              │ └─────────────┘ │                     │ └─────────────┘ │
└─────────────────┘              └─────────────────┘                     └─────────────────┘
                                          │
        ┌─────────────────────────────────┼───────────────────────────────────────┐
        │                                 │                                       │
┌───────▼────────┐              ┌────────▼────────┐                     ┌───────▼────────┐
│   腾讯会议API   │              │     飞书API      │                     │   第三方服务     │
│                │              │                 │                     │                │
│ ┌─────────────┐ │              │ ┌─────────────┐ │                     │ ┌─────────────┐ │
│ │ Webhook事件  │ │              │ │ 多维表格     │ │                     │ │ 阿里云短信    │ │
│ │ 会议录制     │ │              │ │ 通知消息     │ │                     │ │ 邮件服务     │ │
│ │ 参会者管理   │ │              │ │ 应用集成     │ │                     │ │ OpenAI API  │ │
│ └─────────────┘ │              │ └─────────────┘ │                     │ └─────────────┘ │
└─────────────────┘              └─────────────────┘                     └─────────────────┘
```

## 技术栈

### 后端核心技术栈

| 技术 | 版本 | 用途 | 说明 |
|------|------|------|------|
| **Node.js** | 18.x+ | 运行时环境 | 提供高性能的 JavaScript/TypeScript 运行环境 |
| **NestJS** | 10.x | 应用框架 | 基于 TypeScript 的企业级 Node.js 框架，提供模块化架构 |
| **TypeScript** | 5.x | 编程语言 | 提供静态类型检查，增强代码可维护性 |
| **Prisma** | 5.x | ORM 工具 | 类型安全的数据库访问层，提供自动生成的客户端 |
| **PostgreSQL** | 14+ | 关系型数据库 | 主数据库，存储所有业务数据 |
| **Redis** | 7.x | 内存数据库 | 缓存、会话存储和任务队列支持 |
| **Swagger** | 7.x | API 文档 | 自动生成和展示 RESTful API 文档 |
| **Jest** | 29.x | 测试框架 | 单元测试和集成测试框架 |
| **Supertest** | 6.x | API 测试 | HTTP 断言库，用于测试 API 端点 |
| **pnpm** | 8.x | 包管理器 | 高效的磁盘空间利用和依赖管理 |
| **BullMQ** | 4.x | 任务队列 | 基于 Redis 的任务队列系统 |
| **@nestjs/schedule** | 4.x | 任务调度 | 定时任务和 cron 作业支持 |
| **Apollo Server** | 4.x | GraphQL 服务器 | 提供 GraphQL API 能力 |
| **Passport** | 0.6.x | 认证中间件 | 认证策略框架，支持多种认证方式 |
| **bcryptjs** | 2.4.x | 密码加密 | 安全的密码哈希算法 |
| **class-validator** | 0.14.x | 数据验证 | 基于装饰器的数据验证 |
| **class-transformer** | 0.5.x | 数据转换 | 对象转换和序列化工具 |

### 第三方服务集成

| 服务 | 集成方式 | 主要功能 | 用途 |
|------|----------|----------|------|
| **腾讯会议** | Webhook + REST API | 会议事件、录制文件、参会者管理、转写、智能功能 | 接收会议事件，获取录制文件，管理会议数据 |
| **飞书** | REST API + Webhook | 多维表格数据同步、通知消息、应用集成 | 会议数据同步到多维表格，发送通知 |
| **阿里云短信** | REST API | 短信发送、模板管理 | 发送验证码和通知短信 |
| **邮件服务** | SMTP + API | 邮件发送、模板管理 | 发送验证码、通知和系统邮件 |
| **OpenAI** | REST API | AI 文本处理、总结、转录 | 会议内容总结、智能分析 |

### 现代化开发特性

| 特性 | 实现方式 | 优势 |
|------|----------|------|
| **GraphQL 支持** | Apollo Server 集成 | 灵活的数据查询，减少网络请求 |
| **定时任务** | @nestjs/schedule | 自动化任务处理，减少人工干预 |
| **路径别名** | TypeScript 路径映射 | 简化导入路径，提高代码可读性 |
| **TypeScript 严格模式** | tsconfig.json 配置 | 提前发现类型错误，提高代码质量 |
| **队列系统** | BullMQ + Redis | 异步任务处理，提高系统响应能力 |
| **缓存策略** | Redis 集成 | 减少数据库查询，提高系统性能 |
| **API 文档自动化** | Swagger 装饰器 | 实时更新的 API 文档，便于前后端协作 |
| **环境配置管理** | @nestjs/config | 多环境配置支持，提高部署灵活性 |
| **日志系统** | NestJS Logger + Winston | 结构化日志，便于问题排查 |
| **健康检查** | @nestjs/terminus | 系统健康监控，提高系统可靠性 |

## 模块划分

### 模块架构概览

本系统采用模块化架构设计，每个模块遵循单一职责原则，通过依赖注入实现松耦合。模块分为核心业务模块、集成模块和基础设施模块三类。

### 核心业务模块

#### 1. 认证模块 (Auth Module)

**目录结构**: `src/auth/`

**职责**: 用户身份验证、授权管理和令牌处理

**核心组件**:
- **控制器层**:
  - `AuthController`: 认证相关 API 端点
- **服务层**:
  - `RegisterService`: 用户注册流程（验证码校验、用户创建、欢迎邮件）
  - `LoginService`: 用户登录流程（密码/验证码、限流、登录日志）
  - `PasswordService`: 密码重置（验证码校验、密码强度校验、通知邮件）
  - `ProfileService`: 用户资料管理（获取/更新、唯一性校验）
  - `TokenService`: JWT 令牌签发、刷新和验证
  - `TokenBlacklistService`: 令牌撤销（黑名单，基于 jti）
  - `AuthPolicyService`: 登录策略（失败次数限制、登录日志、类型映射）
  - `JwtUserLookupService`: 用户查找和缓存服务
- **仓储层**:
  - `UserRepository`: 用户与档案读写
  - `LoginLogRepository`: 登录日志统计与写入
  - `RefreshTokenRepository`: 刷新令牌管理
- **安全层**:
  - `JwtAuthGuard`: JWT 认证守卫
  - `JwtStrategy`: JWT 认证策略
- **装饰器**:
  - `@Public`: 标记公开接口
  - `@User`: 提取用户信息
  - `@ApiDocs`: API 文档装饰器

#### 2. 会议模块 (Meeting Module)

**目录结构**: `src/meeting/`

**职责**: 会议记录管理、会议数据分析和会议统计

**核心组件**:
- **控制器层**:
  - `MeetingController`: 会议管理 API 接口
- **服务层**:
  - `MeetingService`: 会议记录管理业务逻辑
  - `MeetingStatisticsService`: 会议数据统计服务
- **仓储层**:
  - `MeetingRepository`: 会议数据访问层
- **工具类**:
  - `TextAnalysisUtil`: 会议文本分析工具
- **其他**:
  - 装饰器: 会议记录相关装饰器
  - DTO: 会议记录数据传输对象
  - 类型定义: 会议相关类型定义

#### 3. 用户模块 (User Module)

**目录结构**: `src/user/`

**职责**: 用户信息管理、用户档案维护和权限控制

**核心组件**:
- **控制器层**:
  - `UserController`: 用户管理 API 接口
- **服务层**:
  - `UserService`: 用户信息管理业务逻辑
  - `ProfileService`: 用户档案管理
- **仓储层**:
  - `UserRepository`: 用户数据访问层
- **功能**: 用户档案管理、权限控制

#### 4. 验证码模块 (Verification Module)

**目录结构**: `src/verification/`

**职责**: 验证码生成、发送和验证

**核心组件**:
- **控制器层**:
  - `VerificationController`: 验证码 API 接口
- **服务层**:
  - `VerificationService`: 验证码生成、发送和验证
- **仓储层**:
  - `VerificationRepository`: 验证码数据管理
- **功能**: 邮件和短信验证码多渠道支持

### 集成模块

#### 1. 腾讯会议集成模块 (Tencent Meeting Module)

**目录结构**: `src/hook-tencent-mtg/`

**职责**: 腾讯会议 Webhook 事件处理和 API 调用

**核心组件**:
- **控制器层**:
  - `TencentWebhookController`: Webhook 事件接收
  - `TencentMeetingController`: 管理接口
- **服务层**:
  - `TencentEventHandlerService`: Webhook 事件分发
  - `TencentApiService`: 腾讯会议开放 API 调用
  - `TencentMeetingConfigService`: 配置管理
- **事件处理器**:
  - `MeetingStartedHandler`: 会议开始事件
  - `MeetingEndedHandler`: 会议结束事件
  - `RecordingCompletedHandler`: 录制完成事件
  - `MeetingParticipantJoinedHandler`: 参与者加入事件
- **工具类**:
  - 加密工具: 签名验证和 AES 解密
  - 类型定义: 会议、录制、参会者等 API 响应类型
  - 异常处理: 腾讯会议 API 相关异常

#### 2. 飞书会议模块 (Lark Meeting Module)

**目录结构**: `src/lark-meeting/`

**职责**: 飞书 Webhook 事件处理和会议业务逻辑

**核心组件**:
- **控制器层**:
  - `LarkWebhookController`: 飞书 Webhook 事件接收
- **服务层**:
  - `LarkWebhookService`: 飞书事件处理服务
  - `LarkMeetingService`: 飞书会议业务逻辑
  - `LarkEventWsService`: WebSocket 事件服务
  - `LarkEventProcessor`: 事件队列处理器
- **适配器**:
  - `LarkEventAdapter`: 事件适配器
  - `PickRequestData`: 请求数据提取器
- **兼容性支持**: 保留旧的 `/webhooks/feishu` 路由别名

#### 3. 集成服务模块 (Integration Services)

**目录结构**: `src/integrations/`

**职责**: 第三方服务集成和 API 调用

**子模块**:
- **飞书集成 (Lark Integration)**:
  - `LarkClient`: 飞书 SDK 封装和 API 调用
  - `BitableService`: 多维表格操作服务
  - `MeetingRecordingService`: 会议录制处理服务
  - `Repositories`: 会议、用户、录制文件、数字记录管理
  - 类型定义: MeetingData, MeetingUserData, RecordingFileData 等
  - 异常处理: Lark 相关异常类
  - 数据验证: FieldValidator 字段验证器

- **腾讯会议集成 (Tencent Meeting Integration)**:
  - `TencentApiService`: 腾讯会议开放 API 调用
  - 加密工具: 签名验证和 AES 解密
  - 类型定义: 会议、录制、参会者等 API 响应类型
  - 异常处理: 腾讯会议 API 相关异常

- **其他集成服务**:
  - 阿里云短信 (Aliyun SMS): 短信发送服务
  - 邮件服务 (Email Service): SMTP 邮件发送服务
  - OpenAI 集成: AI 功能支持

#### 4. 邮件模块 (Email Module)

**目录结构**: `src/mail/`

**职责**: 邮件发送和模板管理

**核心组件**:
- **控制器层**:
  - `EmailController`: 邮件发送 API 接口
- **服务层**:
  - `EmailService`: 邮件发送业务逻辑
- **处理器**:
  - `MailProcessor`: 邮件队列处理器
- **模板管理**: 邮件模板系统
- **装饰器**: 邮件相关装饰器

#### 5. 任务模块 (Task Module)

**目录结构**: `src/task/`

**职责**: 任务管理和调度

**核心组件**:
- **控制器层**:
  - `TaskController`: 任务管理 API 接口
- **服务层**:
  - `TaskService`: 任务业务逻辑
- **处理器**:
  - `TaskProcessor`: 任务队列处理器
- **功能**: 定时任务、一次性任务管理

### 基础设施模块

#### 1. 安全模块 (Security Module)

**目录结构**: `src/auth/guards/`, `src/auth/strategies/`

**职责**: 系统安全相关功能

**核心组件**:
- **JWT 守卫**: `JwtAuthGuard`，提供路由级别的身份验证
- **装饰器**: `@Public` 装饰器，用于标记公开接口
- **类型定义**: 安全相关类型和接口

#### 2. 公共模块 (Common Module)

**目录结构**: `src/common/`

**职责**: 公共工具和共享组件

**核心组件**:
- **工具类**: 随机数生成、验证器、HTTP 文件处理
- **枚举类型**: 公共枚举定义
- **邮件模板**: 邮件模板系统

#### 3. 数据库模块 (Database Module)

**目录结构**: `src/prisma/`

**职责**: 数据库连接和操作

**核心组件**:
- `PrismaService`: Prisma 客户端管理
- `PrismaModule`: 数据库模块配置
- **数据库连接**: PostgreSQL 连接管理

#### 4. 缓存模块 (Cache Module)

**目录结构**: `src/redis/`

**职责**: 缓存管理和会话存储

**核心组件**:
- `RedisService`: Redis 客户端管理
- `RedisModule`: 缓存模块配置
- **缓存策略**: 数据缓存、会话存储

#### 5. 配置模块 (Config Module)

**目录结构**: `src/configs/`

**职责**: 系统配置管理

**核心组件**:
- 各种配置服务: JWT、数据库、第三方服务等配置
- 环境变量管理
- 配置验证

## 数据流设计

### 腾讯会议事件处理流程

```text
1. 腾讯会议平台发送Webhook事件
         ↓
2. TencentWebhookController 接收并验证请求
         ├── 请求签名验证 (验证失败: 返回401)
         ├── 请求体解密 (解密失败: 返回400)
         └── 事件格式验证 (格式错误: 返回422)
         ↓
3. TencentEventHandlerService 事件分发
         ├── 事件类型识别
         └── 路由到对应处理器 (未知类型: 记录日志并跳过)
         ↓
4. EventHandlerFactory 选择具体事件处理器
         ├── 根据事件类型创建处理器实例
         └── 注入必要依赖 (失败: 记录错误并返回500)
         ↓
5. 具体事件处理器处理业务逻辑
         ├── 数据解析和验证
         ├── 业务规则检查
         ├── 数据转换和映射
         └── 错误处理和重试机制
         ↓
6. 数据持久化到PostgreSQL数据库
         ├── 事务处理 (失败: 回滚并记录错误)
         ├── 数据验证 (验证失败: 记录错误)
         └── 唯一性检查 (冲突: 更新现有记录)
         ↓
7. (可选) 同步数据到飞书多维表格
         ├── 创建同步任务
         ├── 加入队列 (失败: 记录错误并重试)
         └── 异步处理 (不阻塞主流程)
         ↓
8. 返回处理结果
         ├── 成功: 返回200和事件ID
         └── 失败: 返回错误码和错误信息
```

**错误处理策略**:
- 签名验证失败: 直接拒绝，记录安全日志
- 数据解密失败: 记录错误，返回客户端错误
- 业务处理失败: 记录详细错误，支持重试机制
- 数据库操作失败: 事务回滚，记录错误日志
- 第三方API调用失败: 指数退避重试，熔断机制

### 会议录制文件处理流程

```text
1. 接收录制完成事件 (RecordingCompletedHandler)
         ↓
2. 事件数据验证和解析
         ├── 验证必要字段存在
         ├── 解析录制文件列表
         └── 提取会议和文件元数据
         ↓
3. 调用腾讯会议API获取录制文件详情
         ├── 构建API请求 (包含认证信息)
         ├── 发送HTTP请求 (失败: 重试3次)
         └── 解析响应数据 (格式错误: 记录并跳过)
         ↓
4. 下载录制文件（HttpFileUtil）
         ├── 创建下载任务
         ├── 流式下载文件 (网络错误: 断点续传)
         ├── 校验文件完整性 (失败: 重新下载)
         └── 临时存储 (下载完成后移动)
         ↓
5. 存储文件到对象存储
         ├── 生成唯一文件路径
         ├── 上传到OSS/COS (失败: 重试)
         ├── 设置访问权限和元数据
         └── 删除本地临时文件
         ↓
6. 提取文件元数据
         ├── 文件大小和格式
         ├── 创建和修改时间
         ├── 视频时长和分辨率
         └── 缩略图生成 (异步)
         ↓
7. 创建或更新数据库记录
         ├── 开启数据库事务
         ├── 创建MeetingRecording记录
         ├── 创建MeetingRecordingFile记录
         └── 提交事务 (失败: 回滚)
         ↓
8. 同步到飞书 Bitable (通过 RecordingFileBitableRepository)
         ├── 创建同步任务
         ├── 加入队列
         └── 异步处理 (不阻塞主流程)
         ↓
9. 触发后续处理流程
         ├── AI转录任务 (如配置)
         ├── 通知相关人员
         └── 更新会议状态
```

**错误处理策略**:
- API调用失败: 指数退避重试，最大重试次数
- 文件下载失败: 支持断点续传，多次重试
- 对象存储失败: 本地备份，定期重试
- 数据库操作失败: 事务回滚，详细错误日志

### 飞书 Bitable 数据同步流程

```text
1. 业务事件触发数据更新
         ├── 数据库记录创建/更新
         ├── 事件发布到消息队列
         └── 同步任务创建
         ↓
2. BitableRepository 接收数据操作请求
         ├── 从队列获取任务
         ├── 解析任务参数
         └── 验证任务有效性
         ↓
3. 数据验证和类型转换 (FieldValidator)
         ├── 必填字段检查
         ├── 数据类型转换
         ├── 字段长度限制
         └── 特殊字符处理
         ↓
4. LarkClient 调用飞书 Bitable API
         ├── 构建API请求 (包含认证信息)
         ├── 请求限流控制
         ├── 发送HTTP请求 (失败: 重试)
         └── 解析响应数据
         ↓
5. Upsert 操作（基于唯一键去重）
         ├── 查询现有记录
         ├── 存在则更新，不存在则创建
         ├── 处理字段映射
         └── 处理关联记录
         ↓
6. 返回操作结果和记录 ID
         ├── 更新本地同步状态
         ├── 记录同步日志
         └── 清理临时数据
```

**错误处理策略**:
- 数据验证失败: 记录错误，跳过同步
- API限流: 自动退避，延迟重试
- 网络错误: 指数退避重试
- 数据冲突: 记录冲突，人工干预

### 用户认证流程

```text
1. 用户提交登录请求
         ├── 接收登录凭据 (用户名/密码/验证码)
         ├── 基本格式验证
         └── 请求频率检查 (超限: 返回429)
         ↓
2. LoginService 验证用户凭据
         ├── 查询用户记录 (不存在: 返回401)
         ├── 验证密码/验证码 (错误: 记录失败次数)
         ├── 检查账户状态 (禁用/锁定: 返回403)
         └── 更新最后登录时间
         ↓
3. TokenService 生成 JWT Token
         ├── 生成访问令牌 (包含用户ID、权限)
         ├── 生成刷新令牌
         ├── 设置令牌过期时间
         └── 存储刷新令牌到数据库
         ↓
4. 记录登录日志 (LoginLogRepository)
         ├── 创建登录记录
         ├── 记录IP地址和设备信息
         └── 异步保存 (不阻塞响应)
         ↓
5. 返回认证信息
         ├── 返回访问令牌和刷新令牌
         ├── 返回用户基本信息
         └── 设置令牌过期时间
```

**安全措施**:
- 密码错误次数限制: 超过阈值锁定账户
- 令牌黑名单: 支持令牌撤销
- 刷新令牌轮换: 提高安全性
- 登录异常检测: 异地登录告警

### 邮件/短信验证码流程

```text
1. 用户请求发送验证码
         ├── 接收手机号/邮箱
         ├── 格式验证
         └── 频率限制检查 (超限: 返回429)
         ↓
2. VerificationService 生成验证码
         ├── 生成随机验证码
         ├── 设置过期时间 (通常5-10分钟)
         ├── 计算验证码哈希 (不存储原文)
         └── 生成唯一请求ID
         ↓
3. 调用第三方服务发送 (Aliyun SMS / Email Service)
         ├── 构建发送请求
         ├── 调用API (失败: 重试)
         ├── 记录发送结果
         └── 处理回调 (如支持)
         ↓
4. 存储验证码记录 (VerificationRepository)
         ├── 保存验证码哈希
         ├── 保存过期时间
         ├── 保存请求ID
         └── 保存发送状态
         ↓
5. 用户提交验证码进行验证
         ├── 接收用户输入
         ├── 查询验证码记录
         ├── 验证码比对 (使用哈希)
         ├── 检查过期时间
         ├── 检查使用次数
         └── 标记为已使用
```

**安全措施**:
- 验证码哈希存储: 不存储明文
- 一次性使用: 使用后立即失效
- 频率限制: 防止轰炸攻击
- 复杂度要求: 数字+字母组合

### 异步任务处理流程

```text
1. 业务操作触发任务
         ├── 创建任务定义
         ├── 设置任务参数
         ├── 设置优先级和延迟
         └── 添加到任务队列
         ↓
2. 任务加入 BullMQ 队列
         ├── 序列化任务数据
         ├── 设置任务选项 (重试、延迟等)
         ├── 添加到指定队列
         └── 返回任务ID
         ↓
3. Redis 存储队列数据
         ├── 任务数据存储
         ├── 任务状态跟踪
         ├── 重试计数
         └── 死信队列处理
         ↓
4. TaskProcessor 处理任务
         ├── 从队列获取任务
         ├── 反序列化任务数据
         ├── 执行业务逻辑
         ├── 异常处理和重试
         └── 更新任务状态
         ↓
5. 更新任务状态到数据库
         ├── 记录执行结果
         ├── 保存执行日志
         ├── 更新进度信息
         └── 清理临时数据
```

**错误处理策略**:
- 任务执行失败: 自动重试，指数退避
- 死信队列: 超过重试次数的任务进入死信队列
- 任务超时: 设置执行超时，防止阻塞
- 资源限制: 控制并发任务数量

### AI 功能处理流程

```text
1. 会议录制/转录完成
         ├── 检测到新录制文件
         ├── 验证文件格式
         └── 创建AI处理任务
         ↓
2. 触发 AI 处理任务
         ├── 设置任务类型 (转录/总结/分析)
         ├── 配置处理参数
         ├── 设置优先级
         └── 添加到AI任务队列
         ↓
3. 调用 OpenAI API 进行处理
         ├── 准备请求数据
         ├── 调用API (失败: 重试)
         ├── 流式处理大文件
         └── 处理API响应
         ↓
4. 生成会议总结/分析
         ├── 文本内容分析
         ├── 关键信息提取
         ├── 生成结构化数据
         └── 创建可视化内容
         ↓
5. 存储结果到数据库
         ├── 保存AI处理结果
         ├── 关联原始会议记录
         ├── 标记处理状态
         └── 更新处理时间
         ↓
6. 同步到飞书多维表格
         ├── 创建同步任务
         ├── 数据格式转换
         ├── 上传到飞书表格
         └── 更新同步状态
```

**错误处理策略**:
- API调用失败: 指数退避重试，熔断机制
- 内容处理失败: 记录错误，部分成功处理
- 结果存储失败: 临时保存，定期重试
- 同步失败: 异步重试，不阻塞主流程

## 数据库设计

### 核心实体关系图

```text
用户权限系统
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│    User     │◄─────┤ UserRole     │─────►│    Role     │
└─────────────┘      └──────────────┘      └─────────────┘
      │                      │                      │
      │                      │                      │
      ▼                      ▼                      ▼
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│UserProfile  │      │UserPermission│─────►│ Permission  │
└─────────────┘      └──────────────┘      └─────────────┘
      │                                              │
      │                                              │
      ▼                                              ▼
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│UserOrganization│◄─────┤Organization  │      │RolePermission│
└─────────────┘      └──────────────┘      └─────────────┘
      │
      │
      ▼
┌─────────────┐
│UserDepartment│◄─────┐
└─────────────┘      │
                     │
                     ▼
              ┌──────────────┐
              │  Department  │
              └──────────────┘

会议系统
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Meeting   │◄─────┤MeetingRecord │─────►│RecordingFile│
└─────────────┘      └──────────────┘      └─────────────┘
      │                      │                      │
      │                      │                      │
      ▼                      ▼                      ▼
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│MeetingPartic│─────►│PlatformUser  │      │StorageObject│
│ipant        │      └──────────────┘      └─────────────┘
└─────────────┘               │
      │                       │
      │                       ▼
      │              ┌──────────────┐
      │              │     User     │
      │              └──────────────┘
      ▼
┌─────────────┐
│MeetingSumma │
│ry           │
└─────────────┘
      │
      │
      ▼
┌─────────────┐
│ Transcript  │
└─────────────┘

业务系统
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Product   │◄─────┤     Order     │─────►│ OrderRefund │
└─────────────┘      └──────────────┘      └─────────────┘
      │                      ▲                      ▲
      │                      │                      │
      ▼                      │                      │
┌─────────────┐              │                      │
│   Project   │──────────────┘                      │
└─────────────┘                                     │
                                                     │
┌─────────────┐                                     │
│   Channel   │─────────────────────────────────────┘
└─────────────┘
```

### 主要数据表结构

#### 用户相关表

**User 表 (users)**
```sql
- id: String (主键, CUID)
- username: String? (唯一, 用户名)
- password: String? (密码哈希)
- email: String? (唯一, 邮箱)
- emailVerifiedAt: DateTime? (邮箱验证时间)
- countryCode: String? (国家代码, 如 +86)
- phone: String? (电话号码)
- phoneVerifiedAt: DateTime? (电话验证时间)
- lastLoginAt: DateTime? (最后登录时间)
- active: Boolean (是否激活, 默认 true)
- deletedAt: DateTime? (软删除时间戳)
- createdAt: DateTime (创建时间)
- updatedAt: DateTime (更新时间)

索引:
- @@unique([countryCode, phone])
- @@index([username])
- @@index([email])
- @@index([phone])
- @@index([active])
- @@index([deletedAt])
- @@index([lastLoginAt])
- @@index([active, deletedAt])
```

**UserProfile 表 (user_profiles)**
```sql
- id: String (主键, CUID)
- userId: String (外键, 关联 User)
- firstName: String? (名)
- lastName: String? (姓)
- avatar: String? (头像URL)
- bio: String? (个人简介)
- timezone: String? (时区)
- language: String? (语言偏好)
- metadata: Json? (扩展元数据)
- createdAt: DateTime (创建时间)
- updatedAt: DateTime (更新时间)

关联:
- user: User @relation(fields: [userId], references: [id], onDelete: Cascade)
```

#### 权限系统表

**Organization 表 (organizations)**
```sql
- id: String (主键, CUID)
- name: String (组织名称)
- code: String? (组织代码)
- description: String? (组织描述)
- parentId: String? (父组织ID)
- active: Boolean (是否激活)
- metadata: Json? (扩展元数据)
- createdAt: DateTime (创建时间)
- updatedAt: DateTime (更新时间)
- deletedAt: DateTime? (软删除时间戳)

关联:
- parent: Organization? @relation("OrganizationHierarchy", fields: [parentId], references: [id])
- children: Organization[] @relation("OrganizationHierarchy")
- users: UserOrganization[]
```

**Role 表 (roles)**
```sql
- id: String (主键, CUID)
- name: String (角色名称)
- code: String? (角色代码)
- description: String? (角色描述)
- level: Int? (角色级别)
- isSystem: Boolean (是否系统角色)
- active: Boolean (是否激活)
- metadata: Json? (扩展元数据)
- createdAt: DateTime (创建时间)
- updatedAt: DateTime (更新时间)
- deletedAt: DateTime? (软删除时间戳)

关联:
- users: UserRole[]
- permissions: RolePermission[]
```

**Permission 表 (permissions)**
```sql
- id: String (主键, CUID)
- name: String (权限名称)
- code: String? (权限代码)
- resource: String? (资源)
- action: String? (操作)
- description: String? (权限描述)
- isSystem: Boolean (是否系统权限)
- active: Boolean (是否激活)
- metadata: Json? (扩展元数据)
- createdAt: DateTime (创建时间)
- updatedAt: DateTime (更新时间)
- deletedAt: DateTime? (软删除时间戳)

关联:
- roles: RolePermission[]
- users: UserPermission[]
```

#### 会议相关表

**Meeting 表 (meetings)**
```sql
- id: String (主键, CUID)
- platform: MeetingPlatform (会议平台)
- meetingId: String (平台会议ID)
- subMeetingId: String? (子会议ID)
- externalId: String? (外部系统ID)
- title: String (会议标题)
- description: String? (会议描述)
- meetingCode: String? (会议号码)
- type: MeetingType (会议类型, 默认 SCHEDULED)
- language: String? (会议语言)
- tags: String[] (标签)
- hostPlatformUserId: String? (主持人平台用户ID)
- participantCount: Int? (参与人数)
- scheduledStartAt: DateTime? (预定开始时间)
- scheduledEndAt: DateTime? (预定结束时间)
- startAt: DateTime? (实际开始时间)
- endAt: DateTime? (实际结束时间)
- durationSeconds: Int? (持续时长秒)
- timezone: String? (时区)
- hasRecording: Boolean (是否有录制, 默认 false)
- recordingStatus: ProcessingStatus (录制处理状态, 默认 PENDING)
- processingStatus: ProcessingStatus (整体处理状态, 默认 PENDING)
- metadata: Json? (平台特定元数据)
- createdAt: DateTime (创建时间)
- updatedAt: DateTime (更新时间)
- deletedAt: DateTime? (软删除时间戳)

索引:
- @@unique([platform, meetingId])
- @@index([platform])
- @@index([startAt])
- @@index([endAt])
- @@index([recordingStatus])
- @@index([processingStatus])
- @@index([tags])
- @@index([deletedAt])
- @@index([createdAt])
- @@index([platform, startAt])
- @@index([hostPlatformUserId, startAt])
- @@index([deletedAt, createdAt])
```

**MeetingRecording 表 (meet_recordings)**
```sql
- id: String (主键, CUID)
- meetingId: String (外键, 关联 Meeting)
- source: RecordingSource (录制来源, 默认 PLATFORM_AUTO)
- startAt: DateTime? (录制开始时间)
- endAt: DateTime? (录制结束时间)
- status: RecordingStatus (录制状态, 默认 RECORDING)
- recorderUserId: String? (录制者平台用户ID)
- createdAt: DateTime (创建时间)
- updatedAt: DateTime (更新时间)

关联:
- meeting: Meeting @relation(fields: [meetingId], references: [id], onDelete: Cascade)
- recorderUser: PlatformUser? @relation(fields: [recorderUserId], references: [id], onDelete: SetNull)
- files: MeetingRecordingFile[]
- transcripts: Transcript[]

索引:
- @@index([meetingId])
```

**MeetingSummary 表 (meet_summaries)**
```sql
- id: String (主键, CUID)
- title: String? (总结标题)
- content: String (总结内容)
- keyPoints: Json? (关键要点)
- actionItems: Json? (行动项)
- decisions: Json? (决策记录)
- participants: Json? (参与者总结)
- generatedBy: GenerationMethod? (生成方式)
- aiModel: String? (AI模型版本)
- confidence: Float? (置信度)
- language: String? (总结语言)
- version: Int (版本, 默认 1)
- isLatest: Boolean (是否最新版本, 默认 true)
- parentSummaryId: String? (父总结ID)
- status: ProcessingStatus (状态, 默认 PENDING)
- processingTime: Int? (处理耗时毫秒)
- errorMessage: String? (错误信息)
- createdBy: String? (创建者平台用户ID)
- reviewedBy: String? (审核者平台用户ID)
- reviewedAt: DateTime? (审核时间)
- metadata: Json? (扩展元数据)
- tags: String[] (标签)
- meetingId: String (外键, 关联 Meeting)
- transcriptId: String? (外键, 关联 Transcript)
- deletedAt: DateTime? (软删除时间戳)
- createdAt: DateTime (创建时间)
- updatedAt: DateTime (更新时间)

关联:
- meeting: Meeting @relation(fields: [meetingId], references: [id], onDelete: Cascade)
- transcript: Transcript? @relation(fields: [transcriptId], references: [id], onDelete: SetNull)
- parentSummary: MeetingSummary? @relation("SummaryVersions", fields: [parentSummaryId], references: [id])
- childSummaries: MeetingSummary[] @relation("SummaryVersions")
- creator: PlatformUser? @relation("SummaryCreator", fields: [createdBy], references: [id])
- reviewer: PlatformUser? @relation("ReviewedSummaries", fields: [reviewedBy], references: [id])

索引:
- @@index([meetingId])
- @@index([isLatest])
- @@index([status])
- @@index([createdBy])
- @@index([version])
- @@index([language])
- @@index([reviewedBy])
- @@index([meetingId, isLatest])
- @@index([status, createdAt])
```

#### 业务数据表

**Product 表 (products)**
```sql
- id: String (主键, CUID)
- name: String (产品名称)
- code: String? (产品代码)
- description: String? (产品描述)
- price: Decimal? (价格)
- currency: String? (货币)
- category: String? (分类)
- tags: String[] (标签)
- isActive: Boolean (是否激活)
- metadata: Json? (扩展元数据)
- createdById: String (创建者ID)
- updatedById: String (更新者ID)
- createdAt: DateTime (创建时间)
- updatedAt: DateTime (更新时间)
- deletedAt: DateTime? (软删除时间戳)

关联:
- createdBy: User @relation("ProductCreator", fields: [createdById], references: [id])
- updatedBy: User @relation("ProductUpdater", fields: [updatedById], references: [id])
```

**Order 表 (orders)**
```sql
- id: String (主键, CUID)
- orderNumber: String (订单号, 唯一)
- productId: String (产品ID)
- quantity: Int (数量)
- unitPrice: Decimal (单价)
- totalAmount: Decimal (总金额)
- currency: String (货币)
- status: OrderStatus (订单状态)
- customerId: String (客户ID)
- currentOwnerId: String (当前负责人ID)
- financialCloserId: String? (财务结单人ID)
- orderedAt: DateTime (下单时间)
- deliveredAt: DateTime? (交付时间)
- closedAt: DateTime? (结单时间)
- metadata: Json? (扩展元数据)
- createdAt: DateTime (创建时间)
- updatedAt: DateTime (更新时间)
- deletedAt: DateTime? (软删除时间戳)

关联:
- product: Product @relation(fields: [productId], references: [id])
- customer: User @relation("UserOrders", fields: [customerId], references: [id])
- currentOwner: User @relation("CurrentOwnerOrders", fields: [currentOwnerId], references: [id])
- financialCloser: User? @relation("FinancialCloserOrders", fields: [financialCloserId], references: [id])
- refunds: OrderRefund[]
```

### 数据库特性

#### 索引优化策略
- **用户查询优化**: username, email, phone 单独索引，支持多种登录方式
- **复合索引优化**: active + deletedAt 组合索引，快速筛选活跃用户
- **会议查询优化**: platform + startAt 复合索引，支持按平台和时间范围查询
- **软删除支持**: 所有主要表都有 deletedAt 字段和对应索引
- **时间序列优化**: createdAt, updatedAt, startAt 等时间字段索引
- **关系查询优化**: 外键字段自动索引，加速关联查询

#### 数据完整性保证
- **外键约束**: 确保关联数据的一致性
- **唯一约束**: 防止重复数据，如用户名、邮箱、手机号
- **级联删除**: 合理设置删除策略，维护数据完整性
- **检查约束**: 确保枚举值和数据格式正确
- **软删除**: 重要数据采用软删除，支持数据恢复

#### 扩展性设计
- **JSON 字段**: 存储灵活的元数据和配置信息
- **枚举类型**: 确保数据一致性，同时支持扩展
- **多对多关系**: 通过中间表实现复杂业务关系
- **层级结构**: 支持组织、部门等层级数据
- **分区设计**: 为大数据量表预留分区能力

## 部署架构

### 整体架构图

```text
                    ┌─────────────────────────────────────┐
                    │            外部用户/客户端            │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────▼───────────────────┐
                    │            CDN/负载均衡器            │
                    │         (Nginx/CloudFlare)         │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────▼───────────────────┐
                    │           应用服务器集群             │
                    │    (NestJS + PM2/Systemd)         │
                    └─────────────────┬───────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
┌───────▼────────┐          ┌────────▼────────┐          ┌────────▼────────┐
│   主应用服务    │          │   任务处理服务    │          │   API网关服务    │
│   (HTTP API)   │          │  (BullMQ/Redis)  │          │ (认证/限流/路由) │
└────────┬───────┘          └────────┬────────┘          └────────┬───────┘
         │                           │                             │
         └───────────────────────────┼─────────────────────────────┘
                                     │
                    ┌─────────────────▼───────────────────┐
                    │            数据存储层               │
                    └─────────────────┬───────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
┌───────▼────────┐          ┌────────▼────────┐          ┌────────▼────────┐
│   PostgreSQL   │          │     Redis       │          │   对象存储      │
│   (主数据库)    │          │   (缓存/队列)    │          │ (文件/录制)     │
└────────────────┘          └─────────────────┘          └─────────────────┘

        ┌─────────────────────────────┐
        │        第三方服务集成        │
        │                             │
        │ ┌─────────┐ ┌─────────────┐  │
        │ │腾讯会议 │ │   飞书      │  │
        │ └─────────┘ └─────────────┘  │
        │                             │
        │ ┌─────────┐ ┌─────────────┐  │
        │ │阿里云短信│ │  邮件服务   │  │
        │ └─────────┘ └─────────────┘  │
        │                             │
        │ ┌─────────┐                 │
        │ │ OpenAI  │                 │
        │ └─────────┘                 │
        └─────────────────────────────┘
```

### 环境架构

#### 开发环境

```text
┌─────────────────────────────────────┐
│           本地开发环境               │
│                                     │
│ ┌─────────────┐ ┌─────────────────┐ │
│ │  开发者机器  │ │   Docker容器     │ │
│ │             │ │                 │ │
│ │ NestJS App  │ │ PostgreSQL      │ │
│ │ pnpm dev    │ │ Redis           │ │
│ │             │ │                 │ │
│ └─────────────┘ └─────────────────┘ │
│         │               │           │
│         └───────┬───────┘           │
│                 │                   │
│ ┌───────────────▼───────────────────┐ │
│ │         本地第三方服务模拟          │ │
│ │                                     │ │
│ │ ┌─────────┐ ┌─────────────────┐     │ │
│ │ │Mock服务 │ │   本地SMTP      │     │ │
│ │ └─────────┘ └─────────────────┘     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**特点**:
- 本地开发使用 `pnpm start:dev` 热重载
- 数据库使用本地 PostgreSQL 实例
- 使用 Docker 容器隔离依赖
- 第三方服务使用 Mock 或本地模拟

#### 测试环境

```text
┌─────────────────────────────────────┐
│           测试环境架构               │
│                                     │
│ ┌───────────────────────────────────┐ │
│ │           CI/CD流水线             │ │
│ │                                   │ │
│ │ ┌─────────┐ ┌─────────────────┐   │ │
│ │ │  构建    │ │     测试        │   │ │
│ │ │Pipeline │ │   Pipeline      │   │ │
│ │ └─────────┘ └─────────────────┘   │ │
│ └───────────────────────────────────┘ │
│                 │                   │
│ ┌───────────────▼───────────────────┐ │
│ │         测试服务器集群             │ │
│ │                                   │ │
│ │ ┌─────────┐ ┌─────────────────┐   │ │
│ │ │应用实例1 │ │   应用实例2     │   │ │
│ │ └─────────┘ └─────────────────┘   │ │
│ │                                   │ │
│ │ ┌─────────┐ ┌─────────────────┐   │ │
│ │ │PostgreSQL│ │     Redis       │   │ │
│ │ └─────────┘ └─────────────────┘   │ │
│ └───────────────────────────────────┘ │
│                 │                   │
│ ┌───────────────▼───────────────────┐ │
│ │         测试第三方服务              │ │
│ │                                   │ │
│ │ ┌─────────┐ ┌─────────────────┐   │ │
│ │ │沙箱API  │ │  测试账号       │   │ │
│ │ └─────────┘ └─────────────────┘   │ │
│ └───────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**特点**:
- 使用 Docker Compose 部署完整环境
- 自动化测试流水线
- 使用沙箱环境的第三方服务
- 数据库使用测试专用实例
- 定期重置测试数据

#### 生产环境

```text
┌─────────────────────────────────────────────────────────────┐
│                        生产环境架构                           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    CDN/负载均衡                        │   │
│  │                 (CloudFlare/Nginx)                   │   │
│  └────────────────────────────────┬─────────────────────┘   │
│                                   │                         │
│  ┌────────────────────────────────▼─────────────────────┐   │
│  │                   应用服务器集群                        │   │
│  │                                                      │   │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │   │
│  │ │  API服务    │ │  Web服务    │ │   任务处理服务   │   │   │
│  │ │ (HTTP/REST) │ │ (静态资源)   │ │  (BullMQ/Redis) │   │   │
│  │ └─────────────┘ └─────────────┘ └─────────────────┘   │   │
│  │                                                      │   │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │   │
│  │ │  API服务    │ │  Web服务    │ │   任务处理服务   │   │   │
│  │ │ (HTTP/REST) │ │ (静态资源)   │ │  (BullMQ/Redis) │   │   │
│  │ └─────────────┘ └─────────────┘ └─────────────────┘   │   │
│  └────────────────────────────────┬─────────────────────┘   │
│                                   │                         │
│  ┌────────────────────────────────▼─────────────────────┐   │
│  │                     数据存储层                          │   │
│  │                                                      │   │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │   │
│  │ │ PostgreSQL  │ │    Redis     │ │   对象存储       │   │   │
│  │ │  (主从复制)  │ │  (集群模式)   │ │  (阿里云OSS)    │   │   │
│  │ └─────────────┘ └─────────────┘ └─────────────────┘   │   │
│  │                                                      │   │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │   │
│  │ │ PostgreSQL  │ │    Redis     │ │   对象存储       │   │   │
│  │ │  (只读副本)  │ │  (集群模式)   │ │  (阿里云OSS)    │   │   │
│  │ └─────────────┘ └─────────────┘ └─────────────────┘   │   │
│  └────────────────────────────────┬─────────────────────┘   │
│                                   │                         │
│  ┌────────────────────────────────▼─────────────────────┐   │
│  │                   监控和日志系统                        │   │
│  │                                                      │   │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │   │
│  │ │  Prometheus │ │  Grafana    │ │   ELK Stack     │   │   │
│  │ │   (指标)     │ │  (可视化)    │ │   (日志分析)     │   │   │
│  │ └─────────────┘ └─────────────┘ └─────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   第三方服务集成                          │   │
│  │                                                          │   │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │   │
│  │ │  腾讯会议    │ │    飞书      │ │   阿里云服务     │   │   │
│  │ └─────────────┘ └─────────────┘ └─────────────────┘   │   │
│  │                                                          │   │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │   │
│  │ │  邮件服务    │ │  OpenAI API │ │   短信服务       │   │   │
│  │ └─────────────┘ └─────────────┘ └─────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**特点**:
- 多实例部署，支持水平扩展
- 数据库主从复制，读写分离
- Redis 集群模式，高可用缓存
- CDN 加速静态资源访问
- 完整的监控和日志系统
- 自动备份和灾难恢复

### 部署组件详解

#### 应用服务器配置

**基础配置**:
- CPU: 2核心 (最小) / 4核心 (推荐)
- 内存: 4GB (最小) / 8GB (推荐)
- 存储: 50GB SSD
- 网络: 100Mbps

**软件环境**:
- 操作系统: Ubuntu 20.04 LTS
- Node.js: 20.x LTS
- pnpm: 8.x
- PM2: 最新稳定版

**进程管理**:
```bash
# PM2 配置文件 (ecosystem.config.js)
module.exports = {
  apps: [
    {
      name: 'lulab-backend-api',
      script: 'dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    },
    {
      name: 'lulab-backend-worker',
      script: 'dist/worker.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/worker-err.log',
      out_file: './logs/worker-out.log',
      log_file: './logs/worker-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    }
  ]
};
```

#### 数据库配置

**PostgreSQL 主从配置**:

主库配置 `postgresql.conf`:
```conf
# 连接设置
listen_addresses = '*'
port = 5432
max_connections = 200

# 内存设置
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# WAL设置
wal_level = replica
max_wal_senders = 3
wal_keep_segments = 64
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/archive/%f'

# 检查点设置
checkpoint_completion_target = 0.9
wal_buffers = 16MB
```

从库配置 `recovery.conf`:
```conf
standby_mode = 'on'
primary_conninfo = 'host=master_ip port=5432 user=replicator'
restore_command = 'cp /var/lib/postgresql/archive/%f %p'
```

#### Redis 集群配置

**Redis 集群节点配置**:
```conf
# redis.conf
port 7000
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000
appendonly yes
```

**集群初始化**:
```bash
# 创建集群
redis-cli --cluster create \
  127.0.0.1:7000 127.0.0.1:7001 \
  127.0.0.1:7002 127.0.0.1:7003 \
  127.0.0.1:7004 127.0.0.1:7005 \
  --cluster-replicas 1
```

#### 负载均衡配置

**Nginx 负载均衡配置**:
```nginx
upstream api_backend {
    least_conn;
    server 10.0.1.10:3000 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:3000 max_fails=3 fail_timeout=30s;
    server 10.0.1.12:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name api.example.com;
    
    location / {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # 健康检查
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
    }
}
```

### 环境配置管理

#### 环境变量管理

**开发环境** (`.env.development`):
```bash
# 数据库配置
DATABASE_URL="postgresql://dev_user:dev_pass@localhost:5432/lulab_dev"

# Redis配置
REDIS_URL="redis://localhost:6379"

# 日志级别
LOG_LEVEL="debug"

# 开发模式
NODE_ENV="development"

# 第三方服务(沙箱)
TENCENT_MEETING_SDK_ID="sandbox_sdk_id"
LARK_APP_ID="sandbox_app_id"
```

**测试环境** (`.env.test`):
```bash
# 数据库配置
DATABASE_URL="postgresql://test_user:test_pass@postgres-test:5432/lulab_test"

# Redis配置
REDIS_URL="redis://redis-test:6379"

# 日志级别
LOG_LEVEL="info"

# 测试模式
NODE_ENV="test"

# 第三方服务(测试)
TENCENT_MEETING_SDK_ID="test_sdk_id"
LARK_APP_ID="test_app_id"
```

**生产环境** (`.env.production`):
```bash
# 数据库配置
DATABASE_URL="postgresql://prod_user:secure_pass@postgres-master:5432/lulab_prod"

# Redis配置
REDIS_URL="redis://redis-cluster:6379"

# 日志级别
LOG_LEVEL="warn"

# 生产模式
NODE_ENV="production"

# 第三方服务(生产)
TENCENT_MEETING_SDK_ID="prod_sdk_id"
LARK_APP_ID="prod_app_id"
```

#### 配置管理最佳实践

1. **敏感信息管理**:
   - 使用密钥管理服务 (AWS Secrets Manager / HashiCorp Vault)
   - 避免在代码中硬编码敏感信息
   - 定期轮换 API 密钥和证书

2. **环境隔离**:
   - 不同环境使用不同的数据库实例
   - 第三方服务使用不同的应用凭据
   - 网络隔离，限制跨环境访问

3. **配置验证**:
   - 应用启动时验证必需的环境变量
   - 使用类型安全的配置对象
   - 提供默认值和配置文档

### 容器化部署

#### Dockerfile 示例

```dockerfile
# 多阶段构建
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm build

# 生产镜像
FROM node:20-alpine AS production

# 安装必要的系统依赖
RUN apk add --no-cache dumb-init

# 创建应用用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# 复制依赖和构建产物
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# 设置权限
RUN chown -R nodejs:nodejs /app
USER nodejs

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# 暴露端口
EXPOSE 3000

# 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
```

#### Docker Compose 示例

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://lulab_user:password@postgres:5432/lulab_backend
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
    networks:
      - app-network

  worker:
    build: .
    command: node dist/worker.js
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://lulab_user:password@postgres:5432/lulab_backend
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
    networks:
      - app-network

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=lulab_backend
      - POSTGRES_USER=lulab_user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

### 监控和日志

#### 监控指标

**应用指标**:
- HTTP 请求响应时间
- 错误率和状态码分布
- 数据库连接池使用情况
- 内存和 CPU 使用率
- 任务队列长度和处理时间

**基础设施指标**:
- 服务器负载
- 网络流量
- 磁盘使用率
- 数据库性能指标

#### 日志管理

**日志级别**:
- ERROR: 系统错误，需要立即处理
- WARN: 警告信息，可能的问题
- INFO: 一般信息，重要操作
- DEBUG: 调试信息，详细执行过程

**日志格式**:
```json
{
  "timestamp": "2023-12-16T10:30:00.000Z",
  "level": "info",
  "message": "User login successful",
  "context": {
    "userId": "user_123",
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0..."
  },
  "traceId": "trace_456",
  "spanId": "span_789"
}
```

## 项目结构

```
lulab_backend/
├── src/                           # 源代码目录
│   ├── auth/                      # 认证模块
│   │   ├── controllers/           # 控制器
│   │   ├── services/              # 业务逻辑服务
│   │   ├── repositories/          # 数据访问层
│   │   ├── dto/                   # 数据传输对象
│   │   ├── enums/                 # 枚举定义
│   │   ├── types/                 # 类型定义
│   │   ├── guards/                # 守卫
│   │   ├── strategies/            # 策略
│   │   └── decorators/            # 装饰器
│   ├── meeting/                   # 会议模块
│   ├── hook-tencent-mtg/           # 腾讯会议集成
│   ├── integrations/               # 第三方集成
│   │   ├── lark/                  # 飞书集成
│   │   ├── tencent-meeting/       # 腾讯会议API
│   │   ├── aliyun/                # 阿里云服务
│   │   ├── email/                 # 邮件服务
│   │   └── openai/                # OpenAI集成
│   ├── lark-meeting/              # 飞书会议模块
│   ├── user/                      # 用户模块
│   ├── verification/              # 验证码模块
│   ├── mail/                      # 邮件模块
│   ├── task/                      # 任务模块
│   ├── common/                    # 公共模块
│   ├── configs/                   # 配置模块
│   ├── prisma/                    # 数据库模块
│   └── redis/                     # 缓存模块
├── prisma/                        # 数据库相关
│   ├── models/                    # 数据模型定义
│   ├── seeds/                     # 种子数据
│   ├── migrations/                # 数据库迁移
│   └── schema.prisma              # Prisma主模式文件
├── docs/                          # 文档目录
│   ├── getting-started/           # 入门文档
│   ├── infrastructure/            # 基础设施文档
│   └── reference/                 # 参考文档
├── scripts/                       # 脚本目录
└── test/                          # 测试目录
```

## 开发流程

### 本地开发环境搭建

1. **安装依赖**
   ```bash
   pnpm install
   ```

2. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，配置必要的环境变量
   ```

3. **数据库设置**
   ```bash
   # 生成 Prisma 客户端
   pnpm db:generate
   
   # 运行数据库迁移
   pnpm db:migrate
   
   # 填充种子数据
   pnpm db:seed
   ```

4. **启动开发服务器**
   ```bash
   pnpm start:dev
   ```

### 代码质量检查

```bash
# 代码格式化
pnpm format

# 代码检查和修复
pnpm lint

# 运行测试
pnpm test:unit

# 运行所有测试
pnpm test:all

# 生成测试覆盖率报告
pnpm test:cov
```

### 数据库操作

```bash
# 查看数据库
pnpm db:studio

# 重置数据库
pnpm db:reset

# 备份数据库
pnpm db:backup

# 清理数据
pnpm db:cleandata
```

## 部署架构

### 开发环境

- 单实例应用
- 本地PostgreSQL数据库
- 开发者个人飞书应用
- 本地对象存储模拟

### 生产环境

- 多实例负载均衡
- 主从数据库集群
- 企业级飞书应用
- 云对象存储服务
- 监控和日志系统

## 安全设计

### 认证与授权

- JWT Token认证
- RBAC权限控制
- API密钥管理
- 请求签名验证

### 数据安全

- 敏感信息加密存储
- HTTPS通信
- 数据库连接加密
- 文件传输加密

### 应用安全

- 输入验证和过滤
- SQL注入防护
- XSS防护
- CSRF防护

## 性能优化

### 数据库优化

- 索引优化
- 查询优化
- 连接池管理
- 读写分离

### API优化

- 缓存策略
- 分页处理
- 异步处理
- 批量操作

### 集成优化

- 连接池复用
- 请求合并
- 异步处理
- 错误重试机制

## 监控与日志

### 日志级别

- ERROR: 错误信息
- WARN: 警告信息
- INFO: 一般信息
- DEBUG: 调试信息

### 监控指标

- API响应时间
- 数据库查询性能
- 第三方服务调用成功率
- 系统资源使用情况

## 扩展性设计

### 水平扩展

- 无状态应用设计
- 数据库读写分离
- 缓存集群
- 负载均衡

### 功能扩展

- 插件化架构
- 事件驱动设计
- 微服务拆分
- API网关管理

## 版本管理

### API版本控制

- URL路径版本控制: `/api/v1/`
- 向后兼容性保证
- 版本迁移策略

### 数据库版本控制

- Prisma Migrate
- 数据库迁移脚本
- 回滚机制

## 故障处理

### 容错机制

- 服务降级
- 熔断机制
- 超时控制
- 重试机制

### 数据备份

- 定期数据库备份
- 文件备份策略
- 灾难恢复计划

## 性能优化策略

### 数据库性能优化

#### 索引优化策略

**1. 查询分析**
```sql
-- 分析慢查询
EXPLAIN ANALYZE SELECT * FROM meetings WHERE start_at > NOW() - INTERVAL '7 days';

-- 查看索引使用情况
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE tablename = 'meetings';
```

**2. 复合索引设计**
```sql
-- 会议查询优化
CREATE INDEX CONCURRENTLY idx_meetings_platform_start 
ON meetings(platform, start_at DESC);

-- 用户查询优化
CREATE INDEX CONCURRENTLY idx_users_active_deleted 
ON users(active, deleted_at) WHERE active = true;

-- 会议录制查询优化
CREATE INDEX CONCURRENTLY idx_recordings_meeting_status 
ON meeting_recording(meeting_id, processing_status);
```

**3. 分区表设计**
```sql
-- 按时间分区会议表
CREATE TABLE meetings_partitioned (
    LIKE meetings INCLUDING ALL
) PARTITION BY RANGE (start_at);

-- 创建月度分区
CREATE TABLE meetings_2023_12 PARTITION OF meetings_partitioned
FOR VALUES FROM ('2023-12-01') TO ('2024-01-01');
```

#### 查询优化

**1. 批量操作**
```typescript
// 批量插入会议记录
async createBatchMeetings(meetings: CreateMeetingDto[]) {
  return this.prisma.meeting.createMany({
    data: meetings,
    skipDuplicates: true,
  });
}

// 批量更新会议状态
async updateBatchMeetingStatus(ids: string[], status: ProcessingStatus) {
  return this.prisma.meeting.updateMany({
    where: { id: { in: ids } },
    data: { processingStatus: status },
  });
}
```

**2. 连接池优化**
```typescript
// prisma.service.ts
import { PrismaClient } from '@prisma/client';

export class PrismaService extends PrismaClient {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: ['query', 'info', 'warn', 'error'],
      // 连接池配置
      __internal: {
        engine: {
          // 连接池大小
          connectionLimit: 20,
          // 连接超时
          connectTimeout: 10000,
          // 查询超时
          queryTimeout: 30000,
        },
      },
    });
  }
}
```

### 缓存策略

#### Redis 缓存层次

**1. 多级缓存架构**
```typescript
// cache.service.ts
@Injectable()
export class CacheService {
  constructor(
    @Inject('REDIS_CLIENT') private redis: Redis,
    private cacheManager: Cache,
  ) {}

  // L1: 应用内存缓存 (快速访问)
  async getFromL1(key: string): Promise<any> {
    return this.cacheManager.get(key);
  }

  // L2: Redis 分布式缓存 (共享缓存)
  async getFromL2(key: string): Promise<any> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  // 多级缓存获取
  async get(key: string): Promise<any> {
    // 先从L1获取
    let value = await this.getFromL1(key);
    if (value) return value;

    // 再从L2获取
    value = await this.getFromL2(key);
    if (value) {
      // 回填L1缓存
      await this.cacheManager.set(key, value, 300); // 5分钟
      return value;
    }

    return null;
  }

  // 多级缓存设置
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    // 设置L1缓存
    await this.cacheManager.set(key, value, Math.min(ttl, 300));
    
    // 设置L2缓存
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
}
```

**2. 缓存策略模式**
```typescript
// cache-strategy.ts
export interface CacheStrategy {
  getKey(params: any): string;
  getTTL(): number;
  shouldCache(params: any, result: any): boolean;
}

// 用户信息缓存策略
export class UserInfoCacheStrategy implements CacheStrategy {
  getKey(params: { userId: string }): string {
    return `user:info:${params.userId}`;
  }

  getTTL(): number {
    return 1800; // 30分钟
  }

  shouldCache(): boolean {
    return true;
  }
}

// 会议列表缓存策略
export class MeetingListCacheStrategy implements CacheStrategy {
  getKey(params: { page: number; limit: number; filters: any }): string {
    const filterHash = crypto
      .createHash('md5')
      .update(JSON.stringify(params.filters))
      .digest('hex');
    return `meetings:list:${params.page}:${params.limit}:${filterHash}`;
  }

  getTTL(): number {
    return 600; // 10分钟
  }

  shouldCache(params: any, result: any): boolean {
    // 只缓存第一页的结果
    return params.page === 1 && result.data.length > 0;
  }
}
```

### API 性能优化

#### 1. 响应优化
```typescript
// 压缩中间件
import * as compression from 'compression';

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024,
}));

// 响应时间监控
@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        console.log(`Request took ${duration}ms`);
        
        // 记录慢查询
        if (duration > 1000) {
          Logger.warn(`Slow request: ${duration}ms`);
        }
      }),
    );
  }
}
```

#### 2. 数据传输优化
```typescript
// 分页响应DTO
export class PaginatedResponseDto<T> {
  @ApiProperty()
  data: T[];

  @ApiProperty()
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 字段选择
export class FieldSelectionPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!value.fields) return value;

    const fields = value.fields.split(',');
    return {
      ...value,
      select: fields.reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {}),
    };
  }
}

// 使用示例
@Get()
async getMeetings(
  @Query(new FieldSelectionPipe()) query: any,
) {
  return this.meetingService.findAll(query);
}
```

#### 3. 并发控制
```typescript
// 限流中间件
import { rateLimit } from 'express-rate-limit';

// 全局限流
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 限制每个IP 15分钟内最多1000个请求
  standardHeaders: true,
  legacyHeaders: false,
}));

// API特定限流
const meetingRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 100, // 限制每个IP 1分钟内最多100个会议相关请求
  message: 'Too many meeting requests, please try again later',
});

// 应用到特定路由
app.use('/api/meetings', meetingRateLimit);
```

### 任务队列优化

#### 1. 任务优先级和分片
```typescript
// 任务队列配置
export const meetingQueueConfig = {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

// 高优先级队列
export const highPriorityQueue = new Queue('high-priority', meetingQueueConfig);

// 低优先级队列
export const lowPriorityQueue = new Queue('low-priority', meetingQueueConfig);

// 任务处理器
@Processor('high-priority')
export class HighPriorityProcessor {
  @Process('meeting-webhook')
  async handleMeetingWebhook(job: Job) {
    // 立即处理的重要任务
    const { data } = job;
    await this.meetingWebhookService.process(data);
  }
}

@Processor('low-priority')
export class LowPriorityProcessor {
  @Process('data-sync')
  async handleDataSync(job: Job) {
    // 可以延迟处理的非关键任务
    const { data } = job;
    await this.dataSyncService.sync(data);
  }
}
```

#### 2. 批处理和合并
```typescript
// 批处理服务
@Injectable()
export class BatchProcessorService {
  private readonly batchSize = 50;
  private readonly batchTimeout = 5000; // 5秒
  private batchBuffer: any[] = [];
  private batchTimer: NodeJS.Timeout;

  constructor(
    @InjectQueue('batch-processing') private batchQueue: Queue,
  ) {}

  async addToBatch(item: any) {
    this.batchBuffer.push(item);

    if (this.batchBuffer.length >= this.batchSize) {
      await this.flushBatch();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.flushBatch(), this.batchTimeout);
    }
  }

  private async flushBatch() {
    if (this.batchBuffer.length === 0) return;

    const batch = [...this.batchBuffer];
    this.batchBuffer = [];
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    await this.batchQueue.add('process-batch', { items: batch });
  }
}
```

## 监控策略实施方案

### 1. 应用性能监控 (APM)

#### Prometheus 指标收集
```typescript
// prometheus.service.ts
import { Counter, Histogram, Gauge, Registry } from 'prom-client';

@Injectable()
export class PrometheusService {
  private readonly register = new Registry();

  // 请求计数器
  private readonly httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [this.register],
  });

  // 请求持续时间
  private readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route'],
    buckets: [0.1, 0.5, 1, 2, 5],
    registers: [this.register],
  });

  // 数据库查询计数器
  private readonly dbQueriesTotal = new Counter({
    name: 'db_queries_total',
    help: 'Total number of database queries',
    labelNames: ['operation', 'table'],
    registers: [this.register],
  });

  // 数据库查询持续时间
  private readonly dbQueryDuration = new Histogram({
    name: 'db_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['operation', 'table'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
    registers: [this.register],
  });

  // 活跃用户数
  private readonly activeUsersGauge = new Gauge({
    name: 'active_users',
    help: 'Number of active users',
    registers: [this.register],
  });

  // 任务队列长度
  private readonly queueLengthGauge = new Gauge({
    name: 'queue_length',
    help: 'Number of jobs in queue',
    labelNames: ['queue_name'],
    registers: [this.register],
  });

  // 记录HTTP请求
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestsTotal.labels(method, route, statusCode.toString()).inc();
    this.httpRequestDuration.labels(method, route).observe(duration / 1000);
  }

  // 记录数据库查询
  recordDbQuery(operation: string, table: string, duration: number) {
    this.dbQueriesTotal.labels(operation, table).inc();
    this.dbQueryDuration.labels(operation, table).observe(duration / 1000);
  }

  // 更新活跃用户数
  setActiveUsers(count: number) {
    this.activeUsersGauge.set(count);
  }

  // 更新队列长度
  setQueueLength(queueName: string, length: number) {
    this.queueLengthGauge.labels(queueName).set(length);
  }

  // 获取指标
  getMetrics(): string {
    return this.register.metrics();
  }
}
```

#### 监控中间件
```typescript
// monitoring.interceptor.ts
@Injectable()
export class MonitoringInterceptor implements NestInterceptor {
  constructor(private readonly prometheusService: PrometheusService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const { statusCode } = response;
        const duration = Date.now() - start;

        this.prometheusService.recordHttpRequest(method, url, statusCode, duration);
      }),
      catchError((error) => {
        const duration = Date.now() - start;
        const statusCode = error.getStatus?.() || 500;

        this.prometheusService.recordHttpRequest(method, url, statusCode, duration);
        throw error;
      }),
    );
  }
}
```

### 2. 日志聚合和分析

#### 结构化日志
```typescript
// logger.service.ts
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

export const loggerConfig = WinstonModule.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: {
    service: 'lulab-backend',
  },
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
    
    // 错误日志文件
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
    }),
    
    // 所有日志文件
    new winston.transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

// 请求日志中间件
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { ip, method, originalUrl } = req;
    const userAgent = req.get('User-Agent') || '';
    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');
      const responseTime = Date.now() - startTime;

      const logData = {
        method,
        url: originalUrl,
        statusCode,
        contentLength,
        responseTime,
        ip,
        userAgent,
      };

      if (statusCode >= 400) {
        Logger.error('HTTP Request Error', logData);
      } else {
        Logger.log('HTTP Request', logData);
      }
    });

    next();
  }
}
```

### 3. 健康检查和告警

#### 健康检查端点
```typescript
// health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async check() {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: await this.checkDatabase(),
        redis: await this.checkRedis(),
        memory: this.checkMemory(),
        disk: await this.checkDisk(),
      },
    };

    // 检查所有服务状态
    const allHealthy = Object.values(health.services).every(
      (service) => service.status === 'ok',
    );

    health.status = allHealthy ? 'ok' : 'error';
    
    const statusCode = allHealthy ? 200 : 503;
    
    return {
      statusCode,
      body: health,
    };
  }

  private async checkDatabase() {
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        responseTime: Date.now(),
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  private async checkRedis() {
    try {
      const startTime = Date.now();
      await this.redisService.ping();
      return {
        status: 'ok',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  private checkMemory() {
    const usage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    const freeMemory = require('os').freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    return {
      status: memoryUsagePercent > 90 ? 'error' : 'ok',
      usage: {
        rss: usage.rss,
        heapTotal: usage.heapTotal,
        heapUsed: usage.heapUsed,
        external: usage.external,
        systemMemoryPercent: memoryUsagePercent,
      },
    };
  }

  private async checkDisk() {
    try {
      const stats = await fs.promises.statfs('.');
      const total = stats.blocks * stats.blksize;
      const free = stats.bavail * stats.blksize;
      const used = total - free;
      const usagePercent = (used / total) * 100;

      return {
        status: usagePercent > 90 ? 'error' : 'ok',
        usage: {
          total,
          used,
          free,
          usagePercent,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }
}
```

#### 告警规则配置
```yaml
# prometheus-alerts.yml
groups:
  - name: lulab-backend-alerts
    rules:
      # 高错误率告警
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"

      # 响应时间过长告警
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }} seconds"

      # 数据库连接告警
      - alert: DatabaseConnectionFailure
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection failure"
          description: "Database is down for more than 1 minute"

      # 内存使用率告警
      - alert: HighMemoryUsage
        expr: (process_resident_memory_bytes / process_virtual_memory_max_bytes) > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is above 90%"

      # 队列积压告警
      - alert: QueueBacklog
        expr: queue_length > 1000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Queue backlog detected"
          description: "Queue {{ $labels.queue_name }} has {{ $value }} pending jobs"
```

### 4. 分布式追踪

#### OpenTelemetry 集成
```typescript
// tracing.module.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-grpc';

// 初始化 OpenTelemetry
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'lulab-backend',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

// 追踪中间件
@Injectable()
export class TracingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const trace = trace.getSpan(context.switchToHttp().getRequest());
    if (trace) {
      const span = trace.startSpan('handler');
      
      return next.handle().pipe(
        tap(() => span.end()),
        catchError((error) => {
          span.recordException(error);
          span.end();
          throw error;
        }),
      );
    }
    
    return next.handle();
  }
}
```

通过以上实施方案，LuLab 后端系统可以实现全面的性能优化和监控，确保系统的高可用性和可靠性。这些策略涵盖了数据库、缓存、API、任务队列等各个层面，并提供了详细的代码示例和配置方案。
