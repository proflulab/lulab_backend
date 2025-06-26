# 邮件发送API使用说明

## 概述

本项目提供了自定义的邮件发送接口，支持发送文本和HTML格式的邮件，包括抄送和密送功能。

## 环境配置

1. 复制 `.env.example` 文件为 `.env`
2. 配置SMTP邮件服务参数：

```bash
cp .env.example .env
```

在 `.env` 文件中配置你的邮件服务信息：

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

### 常用邮件服务配置

#### Gmail
- 需要开启两步验证并生成应用专用密码
- SMTP_HOST: smtp.gmail.com
- SMTP_PORT: 587
- SMTP_SECURE: false

#### QQ邮箱
- 需要开启SMTP服务并获取授权码
- SMTP_HOST: smtp.qq.com
- SMTP_PORT: 587
- SMTP_SECURE: false

#### 163邮箱
- SMTP_HOST: smtp.163.com
- SMTP_PORT: 465
- SMTP_SECURE: true

## API接口

### 1. 发送邮件

**接口地址：** `POST /email/send`

**请求参数：**

```json
{
  "to": "recipient@example.com",
  "cc": ["cc1@example.com", "cc2@example.com"],
  "bcc": ["bcc1@example.com"],
  "subject": "邮件主题",
  "text": "纯文本内容",
  "html": "<h1>HTML内容</h1><p>支持HTML格式</p>"
}
```

**参数说明：**
- `to` (必填): 收件人邮箱地址
- `cc` (可选): 抄送邮箱地址数组
- `bcc` (可选): 密送邮箱地址数组
- `subject` (必填): 邮件主题
- `text` (必填): 纯文本内容
- `html` (可选): HTML格式内容

**响应示例：**

成功响应：
```json
{
  "statusCode": 200,
  "message": "邮件发送成功",
  "data": {
    "messageId": "<message-id@example.com>"
  }
}
```

失败响应：
```json
{
  "statusCode": 400,
  "message": "邮件发送失败",
  "error": "错误详情"
}
```

### 2. 验证SMTP连接

**接口地址：** `GET /email/verify`

**响应示例：**

```json
{
  "statusCode": 200,
  "message": "SMTP连接正常",
  "data": {
    "connected": true
  }
}
```

## 使用示例

### curl 示例

```bash
# 发送简单邮件
curl -X POST http://localhost:3000/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "subject": "测试邮件",
    "text": "这是一封测试邮件"
  }'

# 发送HTML邮件
curl -X POST http://localhost:3000/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "cc": ["cc@example.com"],
    "subject": "HTML邮件",
    "text": "纯文本版本",
    "html": "<h1>欢迎</h1><p>这是一封<strong>HTML</strong>邮件</p>"
  }'

# 验证SMTP连接
curl http://localhost:3000/email/verify
```

### JavaScript 示例

```javascript
// 发送邮件
const sendEmail = async () => {
  try {
    const response = await fetch('http://localhost:3000/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'recipient@example.com',
        subject: '测试邮件',
        text: '这是一封测试邮件',
        html: '<h1>测试</h1><p>这是一封测试邮件</p>'
      })
    });
    
    const result = await response.json();
    console.log('邮件发送结果:', result);
  } catch (error) {
    console.error('发送失败:', error);
  }
};

// 验证连接
const verifyConnection = async () => {
  try {
    const response = await fetch('http://localhost:3000/email/verify');
    const result = await response.json();
    console.log('连接状态:', result);
  } catch (error) {
    console.error('验证失败:', error);
  }
};
```

## 启动服务

```bash
# 开发模式
pnpm run start:dev

# 生产模式
pnpm run build
pnpm run start:prod
```

服务启动后，邮件API将在 `http://localhost:3000/email` 路径下可用。

## 注意事项

1. 确保SMTP服务配置正确
2. 某些邮件服务商需要开启SMTP服务并获取专用密码
3. 建议在生产环境中使用环境变量管理敏感信息
4. 注意邮件发送频率限制，避免被标记为垃圾邮件
5. 建议添加适当的错误处理和日志记录