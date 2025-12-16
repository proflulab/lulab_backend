# 数据库设计文档

本文档详细描述了 LuLab 后端系统的数据库设计，包括核心实体关系图、主要数据表结构和数据库特性。

## 核心实体关系图

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

## 主要数据表结构

### 用户相关表

#### User 表 (users)
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

#### UserProfile 表 (user_profiles)
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

### 权限系统表

#### Organization 表 (organizations)
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

#### Role 表 (roles)
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

#### Permission 表 (permissions)
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

### 会议相关表

#### Meeting 表 (meetings)
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

#### MeetingRecording 表 (meet_recordings)
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

#### MeetingSummary 表 (meet_summaries)
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

### 业务数据表

#### Product 表 (products)
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

#### Order 表 (orders)
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

## 数据库特性

### 索引优化策略
- **用户查询优化**: username, email, phone 单独索引，支持多种登录方式
- **复合索引优化**: active + deletedAt 组合索引，快速筛选活跃用户
- **会议查询优化**: platform + startAt 复合索引，支持按平台和时间范围查询
- **软删除支持**: 所有主要表都有 deletedAt 字段和对应索引
- **时间序列优化**: createdAt, updatedAt, startAt 等时间字段索引
- **关系查询优化**: 外键字段自动索引，加速关联查询

### 数据完整性保证
- **外键约束**: 确保关联数据的一致性
- **唯一约束**: 防止重复数据，如用户名、邮箱、手机号
- **级联删除**: 合理设置删除策略，维护数据完整性
- **检查约束**: 确保枚举值和数据格式正确
- **软删除**: 重要数据采用软删除，支持数据恢复

### 扩展性设计
- **JSON 字段**: 存储灵活的元数据和配置信息
- **枚举类型**: 确保数据一致性，同时支持扩展
- **多对多关系**: 通过中间表实现复杂业务关系
- **层级结构**: 支持组织、部门等层级数据
- **分区设计**: 为大数据量表预留分区能力