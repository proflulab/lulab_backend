# API 文档

## 概述

本文档提供了项目中所有公共API端点的详细说明，包括请求参数、响应格式和使用示例。

## 基础信息

- **基础URL**: `/api/v1`
- **认证方式**: JWT Token (Bearer)
- **Content-Type**: `application/json`
- **API文档**: Swagger 可访问 `/api` 路径

## 认证 API (`/api/auth`)

### 用户注册

**POST** `/api/auth/register`

注册新用户。

#### 请求参数

```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "phone": "string", // 可选
  "verificationCode": "string" // 邮箱验证码
}
```

#### 响应

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "createdAt": "timestamp"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

### 用户登录

**POST** `/api/auth/login`

用户登录获取访问令牌。支持用户名/邮箱 + 密码登录，或邮箱/手机 + 验证码登录。

#### 请求参数

```json
{
  "identifier": "string", // 用户名、邮箱或手机号
  "password": "string", // 密码登录时必需
  "verificationCode": "string", // 验证码登录时必需
  "loginType": "PASSWORD|CODE" // 登录方式
}
```

#### 响应

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

### 刷新访问令牌

**POST** `/api/auth/refresh-token`

使用刷新令牌获取新的访问令牌。

#### 请求参数

```json
{
  "refreshToken": "string"
}
```

#### 响应

```json
{
  "accessToken": "jwt_access_token"
}
```

#### 说明

- 刷新令牌带有 `jti`，若刷新令牌已被撤销（加入黑名单），请求将返回 401。

### 重置密码

**POST** `/api/auth/reset-password`

重置用户密码。

#### 请求参数

```json
{
  "email": "string",
  "verificationCode": "string",
  "newPassword": "string"
}
```

#### 响应

```json
{
  "success": true,
  "message": "密码重置成功"
}
```

### 退出登录

**POST** `/api/auth/logout`

撤销当前访问令牌和刷新令牌。支持单设备登出和所有设备登出。

#### 请求头

- `Authorization: Bearer <access_token>`

#### 请求参数

```json
{
  "allDevices": false // 可选，是否登出所有设备
}
```

#### 响应

```json
{
  "success": true,
  "message": "退出登录成功",
  "details": {
    "accessTokenRevoked": true,
    "refreshTokenRevoked": true,
    "allDevicesLoggedOut": false,
    "revokedTokensCount": 2
  }
}
```

#### 说明

- 该接口会将当前访问令牌和刷新令牌加入黑名单
- 支持通过 `allDevices` 参数登出所有设备
- 黑名单默认存储在服务内存中，集群部署建议使用 Redis

## 用户 API (`/api/user`)

### 获取用户资料

**GET** `/api/user/profile`

获取当前用户的资料信息。

#### 请求头

- `Authorization: Bearer <access_token>`

#### 响应

```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "phone": "string",
  "avatar": "string",
  "profile": {
    "firstName": "string",
    "lastName": "string",
    "bio": "string"
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### 更新用户资料

**PUT** `/api/user/profile`

更新当前用户的资料信息。

#### 请求头

- `Authorization: Bearer <access_token>`

#### 请求参数

```json
{
  "username": "string", // 可选
  "email": "string", // 可选
  "phone": "string", // 可选
  "profile": {
    "firstName": "string",
    "lastName": "string",
    "bio": "string"
  }
}
```

#### 响应

```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "phone": "string",
  "profile": {
    "firstName": "string",
    "lastName": "string",
    "bio": "string"
  },
  "updatedAt": "timestamp"
}
```

## 验证码 API (`/api/verification`)

### 发送验证码

**POST** `/api/verification/send`

发送验证码到指定的邮箱或手机号。

#### 请求参数

```json
{
  "target": "string", // 邮箱或手机号
  "type": "REGISTER|LOGIN|RESET_PASSWORD", // 验证码类型
  "countryCode": "string" // 可选，手机号国家代码，默认 +86
}
```

#### 响应

```json
{
  "success": true,
  "message": "验证码发送成功",
  "data": {
    "target": "string",
    "type": "string",
    "expiresIn": 300 // 秒
  }
}
```

### 验证验证码

**POST** `/api/verification/verify`

验证验证码的有效性。

#### 请求参数

```json
{
  "target": "string", // 邮箱或手机号
  "code": "string", // 验证码
  "type": "REGISTER|LOGIN|RESET_PASSWORD" // 验证码类型
}
```

#### 响应

```json
{
  "success": true,
  "message": "验证成功",
  "valid": true
}
```

## 邮件 API (`/email`)

### 发送邮件

**POST** `/email/send`

发送邮件到指定收件人。

#### 请求参数

```json
{
  "to": "string", // 收件人邮箱
  "subject": "string", // 邮件主题
  "text": "string", // 纯文本内容（可选）
  "html": "string" // HTML 内容（可选）
}
```

#### 响应

```json
{
  "statusCode": 200,
  "message": "邮件发送成功",
  "data": {
    "messageId": "string"
  }
}
```

### 邮件服务验证

**GET** `/email/verify`

验证邮件服务配置是否正常。

#### 响应

```json
{
  "status": "ok",
  "message": "邮件服务配置正常"
}
```

### 获取会议记录列表

**GET** `/meeting/records`

获取会议记录列表，支持分页和筛选。

#### 查询参数

- `platform` (string, optional) - 会议平台
- `startDate` (string, optional) - 开始日期 (ISO 8601格式)
- `endDate` (string, optional) - 结束日期 (ISO 8601格式)
- `page` (number, optional) - 页码 (默认: 1)
- `limit` (number, optional) - 每页数量 (默认: 20, 最大: 100)

#### 响应

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "records": [
      {
        "id": "string",
        "platform": "TENCENT_MEETING",
        "platformMeetingId": "string",
        "title": "string",
        "startTime": "timestamp",
        "endTime": "timestamp",
        "durationSeconds": "number",
        "hostUserName": "string",
        "participantCount": "number",
        "hasRecording": "boolean",
        "recordingStatus": "PENDING|PROCESSING|COMPLETED|FAILED",
        "processingStatus": "PENDING|PROCESSING|COMPLETED|FAILED"
      }
    ],
    "pagination": {
      "page": "number",
      "limit": "number",
      "total": "number",
      "totalPages": "number"
    }
  }
}
```

### 获取会议记录详情

**GET** `/meeting/records/:id`

获取指定会议记录的详细信息。

#### 路径参数

- `id` (string) - 会议记录ID

#### 响应

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "string",
    "platform": "TENCENT_MEETING",
    "platformMeetingId": "string",
    "title": "string",
    "description": "string",
    "meetingCode": "string",
    "type": "ONE_TIME|RECURRING|INSTANT|SCHEDULED|WEBINAR",
    "hostUserName": "string",
    "participantCount": "number",
    "scheduledStartTime": "timestamp",
    "startTime": "timestamp",
    "endTime": "timestamp",
    "scheduledEndTime": "timestamp",
    "durationSeconds": "number",
    "timezone": "string",
    "hasRecording": "boolean",
    "recordingStatus": "PENDING|PROCESSING|COMPLETED|FAILED",
    "processingStatus": "PENDING|PROCESSING|COMPLETED|FAILED",
    "tags": ["string"],
    "language": "string",
    "metadata": {},
    "participations": [
      {
        "id": "string",
        "joinTime": "timestamp",
        "leftTime": "timestamp",
        "durationSeconds": "number",
        "userRole": "number"
      }
    ],
    "files": [
      {
        "id": "string",
        "fileName": "string",
        "fileType": "VIDEO|AUDIO|TRANSCRIPT|SUMMARY|CHAT|SHARED_SCREEN|WHITEBOARD|DOCUMENT|OTHER",
        "fileSize": "number",
        "storageType": "LOCAL|OSS|COS|S3|MINIO|URL",
        "storageUrl": "string",
        "processingStatus": "PENDING|PROCESSING|COMPLETED|FAILED"
      }
    ],
    "transcripts": [
      {
        "id": "string",
        "paragraphId": "string",
        "speakerName": "string",
        "startTime": "number",
        "endTime": "number",
        "text": "string"
      }
    ],
    "summaries": [
      {
        "id": "string",
        "title": "string",
        "content": "string",
        "sourceType": "RECORDING|TRANSCRIPT|MANUAL|HYBRID",
        "status": "PENDING|PROCESSING|COMPLETED|FAILED",
        "isLatest": "boolean"
      }
    ],
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

## Webhook API

### 腾讯会议 Webhook (`/webhooks/tencent`)

#### Webhook 验证

**GET** `/webhooks/tencent`

用于腾讯会议平台验证webhook URL的有效性。

##### 查询参数

- `check_str` (string) - 加密的随机字符串

##### 请求头

- `timestamp` (string) - 时间戳
- `nonce` (string) - 随机数
- `signature` (string) - 消息签名

##### 响应

```text
解密后的check_str字符串
```

#### Webhook 事件接收

**POST** `/webhooks/tencent`

接收腾讯会议的事件通知。

##### 支持的事件类型

- `meeting.started` - 会议开始
- `meeting.end` - 会议结束  
- `recording.completed` - 录制完成

##### 请求体

```json
{
  "event_type": "string", // 事件类型
  "event_data": {} // 加密的事件数据
}
```

##### 响应

```json
{
  "success": true,
  "message": "事件处理成功"
}
```

### 飞书 Webhook (`/webhooks/lark`)

#### Webhook 事件接收

**POST** `/webhooks/lark`

接收飞书的事件通知。同时支持旧的 `/webhooks/feishu` 路由别名。

##### 请求体

```json
{
  "event_type": "string", // 事件类型
  "event_data": {} // 事件数据
}
```

##### 响应

```json
{
  "statusCode": 200,
  "message": "Webhook 处理成功"
}
```

## GraphQL API

项目集成了 Apollo Server，提供 GraphQL API 支持。

### GraphQL Playground

- **URL**: `/graphql`
- **Playground**: `http://localhost:3000/graphql`
- **内省察**: 开发环境默认开启

### 认证

GraphQL 查询同样需要 JWT 认证，在 HTTP 请求头中包含：

```
Authorization: Bearer <access_token>
```

### 示例查询

```graphql
query {
  hello
}
```

所有API错误响应遵循统一格式：

```json
{
  "code": "number",
  "message": "string",
  "error": "string" // 可选，详细错误信息
}
```

### 常见错误码

- `400` - 请求参数错误
- `401` - 未授权
- `403` - 禁止访问
- `404` - 资源未找到
- `500` - 服务器内部错误

## 速率限制

API调用受速率限制保护：

- **普通用户**: 100次/分钟
- **认证用户**: 1000次/分钟
- **管理员**: 5000次/分钟

超过限制将返回429状态码。

## 版本历史

### v1.0.0 (最新)

- 初始版本
- 提供基础认证和会议API
