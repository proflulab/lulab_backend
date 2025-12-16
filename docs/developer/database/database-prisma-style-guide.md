# 数据库 & Prisma 设计规范（Style Guide）

本规范用于统一 **数据库（PostgreSQL）** 与 **Prisma Schema** 的设计与命名方式，
目标是：清晰、一致、可维护、可扩展。

---

## 1. 总体原则

### 1.1 分层命名原则

| 层级 | 命名风格 | 示例 |
| :--- | :--- | :--- |
| **数据库表名** | `snake_case`（复数） | `meeting_participants` |
| **数据库列名** | `snake_case` | `host_user_id` |
| **Prisma Model** | `PascalCase` | `MeetingParticipant` |
| **Prisma 字段** | `camelCase` | `hostUserId` |
| **代码（TS）** | `camelCase` | `meeting.hostUserId` |

> [!TIP]
> Swagger/Prisma 使用 `@map` / `@@map` 映射数据库命名

---

## 2. Prisma 命名规范

### 2.1 Model 命名

- 使用 **单数**
- 使用 **PascalCase**
- 语义清晰、避免缩写

```prisma
model Meeting {}
model RecordingFile {}
model TranscriptSegment {}
```

> [!CAUTION]
> **不推荐**：

 ```prisma
 model Meetings {}
 model rec_file {}
 ```

---

### 2.2 表名映射（`@@map`）

**所有 Model 必须显式声明表名**

```prisma
model Meeting {
  ...
  @@map("meetings")
}
```

**原因**：
- 防止未来 Prisma 默认策略变更
- 明确数据库真实结构
- 便于 DBA / SQL 直接查看

---

### 2.3 字段命名（`@map`）

**规则**：
- Prisma 字段：`camelCase`
- 数据库列：`snake_case`
- 凡是命名不一致，必须写 `@map`

```prisma
hostUserId String? @map("host_user_id") @db.Uuid
createdAt  DateTime @map("created_at")
```

> [!WARNING]
> 禁止在 Prisma 中使用 `snake_case` 字段名

---

## 3. 主键与外键规范

### 3.1 主键（Primary Key）

- 所有表必须有 `id`
- 类型统一使用 `UUID`
- Prisma 写法：

```prisma
id String @id @default(uuid()) @db.Uuid
```

---

### 3.2 外键（Foreign Key）

**命名规则**：
`<关联模型名>Id`

```prisma
tenantId  String @map("tenant_id") @db.Uuid
meetingId String @map("meeting_id") @db.Uuid
```

**关系定义必须完整**：

```prisma
tenant Tenant @relation(fields: [tenantId], references: [id])
```

---

## 4. 时间字段规范（非常重要）

### 4.1 标准时间字段

| 字段 | 是否必须 | 说明 |
| :--- | :--- | :--- |
| `created_at` | ✅ | 创建时间 |
| `updated_at` | ✅（强烈建议） | 更新时间 |
| `deleted_at` | 可选 | 软删除 |

```prisma
createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
updatedAt DateTime @default(now()) @map("updated_at") @db.Timestamptz(6)
```

> [!IMPORTANT]
> 统一使用 `timestamptz`（带时区）

---

### 4.2 业务时间字段命名

| 场景 | 示例 |
| :--- | :--- |
| 开始时间 | `startAt` |
| 结束时间 | `endAt` |
| 实际开始 | `actualStartAt` |
| 实际结束 | `actualEndAt` |

> [!CAUTION]
> **禁止**：
> - `start_time`
> - `beginTime`

---

## 5. 状态字段规范（status）

### 5.1 状态字段统一规则

- 字段名：`status`
- 类型：`smallint`
- 含义写在注释 / 文档中

```prisma
status Int @default(0) @db.SmallInt
```

**示例（会议状态）**：

| 值 | 含义 |
| :--- | :--- |
| 0 | 未开始 |
| 1 | 进行中 |
| 2 | 已结束 |
| 3 | 已取消 |

> [!NOTE]
> 不要在早期强行 `enum`，先 `smallint`

---

## 6. 枚举 / 字典字段规范

### 6.1 初期推荐（简单）

```prisma
source   Int @default(0) @db.SmallInt
fileType Int @default(0) @db.SmallInt
role     Int @default(0) @db.SmallInt
```

### 6.2 中后期可升级方案

- Prisma `enum`
- 或独立字典表（`dict_recording_source`）

---

## 7. JSON / 扩展字段规范

### 7.1 JSONB 使用场景

- AI 输出
- 可变结构
- 扩展元数据

```prisma
metadata    Json @default("{}") @db.JsonB
actionItems Json @default("[]") @db.JsonB
```

> [!WARNING]
> 禁止在 JSON 中存核心关系字段

---

## 8. 索引规范

### 8.1 必建索引场景

| 场景 | 示例 |
| :--- | :--- |
| 外键 | `meeting_id` |
| 时间查询 | `(tenant_id, created_at)` |
| 状态过滤 | `(tenant_id, status)` |

```prisma
@@index([tenantId, createdAt], map: "idx_xxx_tenant_time")
```

### 8.2 索引命名规则

`idx_<table>_<fields>`

---

## 9. 软删除规范（如需要）

```prisma
deletedAt DateTime? @map("deleted_at") @db.Timestamptz(6)
```

**规则**：
- 查询默认过滤 `deletedAt IS NULL`
- 禁止物理删除核心业务数据

---

## 10. 审计 / 操作日志规范

### 10.1 操作日志必含字段

```prisma
action     String
targetType String
targetId   String?
metadata   Json
```

> [!IMPORTANT]
> 日志只增不改，不允许 `UPDATE` / `DELETE`

---

## 11. 禁止事项（红线）

> [!CAUTION]
> - ❌ Prisma 字段使用 `snake_case`
> - ❌ 一个字段多重语义
> - ❌ JSON 代替关系表
> - ❌ 没有 `created_at` 的业务表
> - ❌ 没有索引的高频外键

---
