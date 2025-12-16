# 部署架构文档

本文档详细描述了 LuLab 后端系统的部署架构，包括整体架构图、不同环境的部署方案、组件配置和环境管理。

## 整体架构图

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

## 环境架构

### 开发环境

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

### 测试环境

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

### 生产环境

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

## 部署组件详解

### 应用服务器配置

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

### 数据库配置

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

### Redis 集群配置

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

### 负载均衡配置

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

## 环境配置管理

### 环境变量管理

**开发环境** (`.env.development`):
```bash
# 数据库配置
DATABASE_URL="postgresql://postgres:password@localhost:5432/lulab_dev"

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=dev-secret-key
JWT_EXPIRES_IN=7d

# 应用配置
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug

# 第三方服务配置 (使用测试账号)
TENCENT_MEETING_APP_ID=dev_app_id
TENCENT_MEETING_SDK_ID=dev_sdk_id
TENCENT_MEETING_SECRET=dev_secret

# 邮件配置 (使用本地SMTP)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@lulab.dev

# 短信配置 (使用Mock)
SMS_ACCESS_KEY=mock_key
SMS_SECRET=mock_secret
SMS_SIGN_NAME=测试签名

# OpenAI配置 (使用Mock)
OPENAI_API_KEY=mock_key
OPENAI_ORG_ID=
```

**测试环境** (`.env.test`):
```bash
# 数据库配置
DATABASE_URL="postgresql://postgres:password@db-test:5432/lulab_test"

# Redis配置
REDIS_HOST=redis-test
REDIS_PORT=6379
REDIS_PASSWORD=test_redis_password

# JWT配置
JWT_SECRET=test-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# 应用配置
PORT=3000
NODE_ENV=test
LOG_LEVEL=info

# 第三方服务配置 (使用沙箱环境)
TENCENT_MEETING_APP_ID=test_app_id
TENCENT_MEETING_SDK_ID=test_sdk_id
TENCENT_MEETING_SECRET=test_secret

# 邮件配置
SMTP_HOST=smtp.test.com
SMTP_PORT=587
SMTP_USER=test@lulab.com
SMTP_PASS=test_password
SMTP_FROM=noreply@lulab.test

# 短信配置
SMS_ACCESS_KEY=test_access_key
SMS_SECRET=test_secret
SMS_SIGN_NAME=测试签名

# OpenAI配置
OPENAI_API_KEY=test_api_key
OPENAI_ORG_ID=test_org_id
```

**生产环境** (`.env.production`):
```bash
# 数据库配置
DATABASE_URL="postgresql://postgres:strong_password@db-master:5432/lulab_prod"

# Redis配置
REDIS_HOST=redis-cluster
REDIS_PORT=6379
REDIS_PASSWORD=strong_redis_password

# JWT配置
JWT_SECRET=super-strong-jwt-secret-key-change-regularly
JWT_EXPIRES_IN=24h

# 应用配置
PORT=3000
NODE_ENV=production
LOG_LEVEL=warn

# 第三方服务配置 (生产环境)
TENCENT_MEETING_APP_ID=prod_app_id
TENCENT_MEETING_SDK_ID=prod_sdk_id
TENCENT_MEETING_SECRET=prod_secret

# 邮件配置
SMTP_HOST=smtp.production.com
SMTP_PORT=587
SMTP_USER=noreply@lulab.com
SMTP_PASS=strong_email_password
SMTP_FROM=noreply@lulab.com

# 短信配置
SMS_ACCESS_KEY=prod_access_key
SMS_SECRET=prod_secret
SMS_SIGN_NAME=LuLab

# OpenAI配置
OPENAI_API_KEY=prod_api_key
OPENAI_ORG_ID=prod_org_id
```

### 部署脚本

**Docker Compose 开发环境** (`docker-compose.dev.yml`):
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    depends_on:
      - postgres
      - redis
    command: pnpm start:dev

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: lulab_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

**Docker Compose 生产环境** (`docker-compose.prod.yml`):
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis
    networks:
      - app-network

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: lulab_prod
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backup:/backup
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
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
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

### CI/CD 流水线

**GitHub Actions 工作流** (`.github/workflows/deploy.yml`):
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'pnpm'
    
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    
    - name: Run linting
      run: pnpm lint
    
    - name: Run tests
      run: pnpm test:ci
    
    - name: Build application
      run: pnpm build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /opt/lulab-backend
          git pull origin main
          pnpm install --frozen-lockfile
          pnpm build
          pnpm db:migrate
          pm2 reload ecosystem.config.js
```

## 监控和日志

### 应用监控

**Prometheus 配置** (`prometheus.yml`):
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'lulab-backend'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s
```

**Grafana 仪表板配置**:
- 应用性能指标 (响应时间、吞吐量)
- 系统资源监控 (CPU、内存、磁盘)
- 数据库性能指标 (连接数、查询时间)
- 错误率和异常监控

### 日志管理

**ELK Stack 配置**:
- **Elasticsearch**: 日志存储和索引
- **Logstash**: 日志收集和处理
- **Kibana**: 日志可视化界面

**日志格式标准**:
```json
{
  "timestamp": "2023-10-01T12:00:00.000Z",
  "level": "info",
  "message": "User login successful",
  "context": {
    "userId": "user_123",
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "requestId": "req_456"
  },
  "service": "lulab-backend",
  "version": "1.0.0"
}
```

## 备份和恢复

### 数据库备份策略

**自动备份脚本** (`scripts/backup-db.sh`):
```bash
#!/bin/bash

# 配置
DB_NAME="lulab_prod"
DB_USER="postgres"
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_backup_$DATE.sql"

# 创建备份
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_FILE

# 压缩备份文件
gzip $BACKUP_FILE

# 删除7天前的备份
find $BACKUP_DIR -name "${DB_NAME}_backup_*.sql.gz" -mtime +7 -delete

echo "Database backup completed: $BACKUP_FILE.gz"
```

**定时备份任务** (crontab):
```bash
# 每天凌晨2点执行备份
0 2 * * * /opt/lulab-backend/scripts/backup-db.sh >> /var/log/backup.log 2>&1
```

### 灾难恢复计划

**恢复流程**:
1. 评估故障范围和影响
2. 确定恢复点目标 (RPO) 和恢复时间目标 (RTO)
3. 从最新备份恢复数据
4. 验证数据完整性
5. 恢复应用服务
6. 监控系统运行状态

**恢复脚本** (`scripts/restore-db.sh`):
```bash
#!/bin/bash

if [ $# -ne 1 ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

BACKUP_FILE=$1
DB_NAME="lulab_prod"
DB_USER="postgres"

# 检查备份文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# 恢复数据库
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c $BACKUP_FILE | psql -h localhost -U $DB_USER -d $DB_NAME
else
    psql -h localhost -U $DB_USER -d $DB_NAME < $BACKUP_FILE
fi

echo "Database restore completed from: $BACKUP_FILE"
```