# 性能优化策略

本文档详细描述了 LuLab 后端系统的性能优化策略，包括数据库优化、缓存策略、API 性能优化、任务队列优化以及监控策略实施。

## 数据库性能优化

### 索引优化策略

#### 1. 查询分析

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

#### 2. 复合索引设计

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

#### 3. 分区表设计

```sql
-- 按时间分区会议表
CREATE TABLE meetings_partitioned (
    LIKE meetings INCLUDING ALL
) PARTITION BY RANGE (start_at);

-- 创建月度分区
CREATE TABLE meetings_2023_12 PARTITION OF meetings_partitioned
FOR VALUES FROM ('2023-12-01') TO ('2024-01-01');
```

### 查询优化

#### 1. 批量操作

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

#### 2. 连接池优化

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

## 缓存策略

### Redis 缓存层次

#### 1. 多级缓存架构

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

#### 2. 缓存策略模式

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

## API 性能优化

### 1. 响应优化

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

### 2. 数据传输优化

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

### 3. 并发控制

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

## 任务队列优化

### 1. 任务优先级和分片

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

### 2. 批处理和合并

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