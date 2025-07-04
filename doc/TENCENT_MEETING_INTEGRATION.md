# 腾讯会议集成功能

本项目已成功集成腾讯会议API，可以接收腾讯会议的webhook事件并将会议数据存储到PostgreSQL数据库中。

## 功能特性

- ✅ 腾讯会议Webhook验证和事件接收
- ✅ 录制完成事件处理
- ✅ 会议录制文件下载和存储
- ✅ 会议参与者信息获取
- ✅ 转录文本和会议纪要处理
- ✅ PostgreSQL数据库存储
- ✅ RESTful API查询接口

## 项目结构

```
src/
├── meeting/                          # 会议模块
│   ├── dto/
│   │   └── meeting.dto.ts           # 数据传输对象
│   ├── meeting.controller.ts        # 控制器 - 处理HTTP请求
│   ├── meeting.service.ts           # 服务层 - 业务逻辑
│   └── meeting.module.ts            # 模块配置
└── utils/
    └── tencent-meeting/             # 腾讯会议工具类
        ├── crypto.ts                # 加密解密工具
        ├── types.ts                 # 类型定义
        └── meeting-api.service.ts   # API服务
```

## 环境配置

复制 `.env.example` 到 `.env` 并配置以下环境变量：

```bash
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/lulab_backend?schema=public"

# 腾讯会议配置
TENCENT_MEETING_APP_ID="your_app_id"
TENCENT_MEETING_SDK_ID="your_sdk_id"
TENCENT_MEETING_SECRET_ID="your_secret_id"
TENCENT_MEETING_SECRET_KEY="your_secret_key"
TENCENT_MEETING_TOKEN="your_webhook_token"
TENCENT_MEETING_ENCODING_AES_KEY="your_encoding_aes_key"
```

## API端点

### Webhook端点

#### 1. Webhook验证 (GET)

```
GET /meeting/tencent/webhook
```

用于腾讯会议平台验证webhook URL的有效性。

#### 2. Webhook事件接收 (POST)

```
POST /meeting/tencent/webhook
```

接收腾讯会议的事件通知，目前支持：

- `recording.completed` - 录制完成事件

### 查询端点

#### 3. 获取会议记录列表

```
GET /meeting/records
```

查询参数：

- `platform` - 会议平台 (可选)
- `startDate` - 开始日期 (可选)
- `endDate` - 结束日期 (可选)
- `page` - 页码 (可选，默认1)
- `limit` - 每页数量 (可选，默认20)

#### 4. 获取会议记录详情

```
GET /meeting/records/:id
```

#### 5. 健康检查

```
GET /meeting/health
```

## 数据库模型

### MeetingRecord (会议记录)

- 会议基本信息（标题、描述、会议号等）
- 主持人和参与者信息
- 时间信息（开始时间、结束时间、时长）
- 录制和处理状态
- AI处理结果（转录、总结、关键要点等）

### MeetingFile (会议文件)

- 文件基本信息（文件名、类型、大小等）
- 存储信息（存储方式、路径、URL等）
- 文件内容（适用于文本文件）
- 处理状态

## 使用流程

1. **配置腾讯会议Webhook**
   - 在腾讯会议开放平台配置webhook URL: `https://your-domain.com/meeting/tencent/webhook`
   - 设置相应的Token和EncodingAESKey

2. **启动应用**

   ```bash
   # 安装依赖
   pnpm install

   # 生成Prisma客户端
   npx prisma generate

   # 运行数据库迁移
   npx prisma db push

   # 启动应用
   pnpm run start:dev
   ```

3. **接收事件**
   - 当腾讯会议录制完成时，系统会自动接收webhook事件
   - 系统会获取录制文件详情、下载文件内容、处理参与者信息
   - 所有数据会存储到PostgreSQL数据库中

4. **查询数据**
   - 使用REST API查询会议记录和文件信息
   - 支持分页、筛选等功能

## 安全特性

- ✅ Webhook签名验证
- ✅ AES加密数据解密
- ✅ 环境变量配置敏感信息
- ✅ 错误处理和日志记录

## 扩展功能

系统设计支持多平台扩展，可以轻松添加其他会议平台的集成：

- Zoom
- Microsoft Teams
- 钉钉
- 飞书
- Cisco Webex

## 故障排除

1. **Webhook验证失败**
   - 检查Token和EncodingAESKey配置
   - 确认时间戳和签名计算正确

2. **数据库连接失败**
   - 检查DATABASE_URL配置
   - 确认PostgreSQL服务运行正常

3. **API调用失败**
   - 检查腾讯会议API密钥配置
   - 确认网络连接正常

## 开发说明

本实现参考了原有的Next.js API代码，并完全迁移到NestJS框架，主要改进：

1. **模块化架构** - 使用NestJS的模块系统组织代码
2. **依赖注入** - 更好的代码解耦和测试支持
3. **类型安全** - 完整的TypeScript类型定义
4. **错误处理** - 统一的异常处理机制
5. **日志记录** - 结构化的日志输出
6. **配置管理** - 环境变量统一管理

项目已通过TypeScript编译检查，可以直接部署使用。
