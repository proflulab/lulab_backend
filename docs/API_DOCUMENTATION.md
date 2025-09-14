# API 文档

## 概述

本文档提供了项目中所有公共API端点的详细说明，包括请求参数、响应格式和使用示例。

## 基础信息

- **基础URL**: `/api/v1`
- **认证方式**: JWT Token
- **Content-Type**: `application/json`

## 认证 API

### 用户注册

**POST** `/auth/register`

注册新用户。

#### 请求参数

```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "phone": "string" // 可选
}
```

#### 响应

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "createdAt": "timestamp"
    },
    "token": "jwt_token"
  }
}
```

### 用户登录

**POST** `/auth/login`

用户登录获取访问令牌。

#### 请求参数

```json
{
  "identifier": "string", // 用户名或邮箱
  "password": "string"
}
```

#### 响应

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string"
    },
    "token": "jwt_token"
  }
}
```

## 会议 API

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

## 腾讯会议 Webhook API

### Webhook 验证

**GET** `/meeting/tencent/webhook`

用于腾讯会议平台验证webhook URL的有效性。

#### 查询参数

- `msg_signature` (string) - 消息签名
- `timestamp` (string) - 时间戳
- `nonce` (string) - 随机数
- `echostr` (string) - 加密的随机字符串

#### 响应

```text
解密后的echostr字符串
```

### Webhook 事件接收

**POST** `/meeting/tencent/webhook`

接收腾讯会议的事件通知。

#### 请求体

```json
{
  "event_type": "string", // 事件类型
  "event_data": {} // 事件数据
}
```

#### 响应

```json
{
  "code": 0,
  "message": "success"
}
```

## 错误响应格式

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