# 监控策略实施方案

本文档详细描述了 LuLab 后端系统的监控策略实施方案，包括应用性能监控 (APM)、日志聚合和分析、健康检查和告警以及分布式追踪。

## 1. 应用性能监控 (APM)

### Prometheus 指标收集

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

### 监控中间件

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

## 2. 日志聚合和分析

### 结构化日志

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

## 3. 健康检查和告警

### 健康检查端点

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

### 告警规则配置

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

## 4. 分布式追踪

### OpenTelemetry 集成

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

## 5. 监控仪表板

### Grafana 仪表板配置

```json
{
  "dashboard": {
    "title": "LuLab Backend Monitoring",
    "panels": [
      {
        "title": "HTTP Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"4..\"}[5m])",
            "legendFormat": "4xx errors"
          },
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m])",
            "legendFormat": "5xx errors"
          }
        ]
      },
      {
        "title": "Database Query Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(db_queries_total[5m])",
            "legendFormat": "{{operation}} {{table}}"
          }
        ]
      },
      {
        "title": "Queue Length",
        "type": "graph",
        "targets": [
          {
            "expr": "queue_length",
            "legendFormat": "{{queue_name}}"
          }
        ]
      },
      {
        "title": "Active Users",
        "type": "singlestat",
        "targets": [
          {
            "expr": "active_users"
          }
        ]
      }
    ]
  }
}
```

## 6. 日志分析

### ELK Stack 集成

```yaml
# logstash.conf
input {
  beats {
    port => 5044
  }
}

filter {
  if [fields][service] == "lulab-backend" {
    json {
      source => "message"
    }
    
    date {
      match => [ "timestamp", "ISO8601" ]
    }
    
    if [level] == "error" {
      mutate {
        add_tag => [ "error" ]
      }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "lulab-backend-%{+YYYY.MM.dd}"
  }
}
```

### Kibana 查询示例

```json
{
  "query": {
    "bool": {
      "must": [
        {
          "term": {
            "fields.service": "lulab-backend"
          }
        },
        {
          "range": {
            "@timestamp": {
              "gte": "now-1h"
            }
          }
        }
      ]
    }
  },
  "aggs": {
    "error_rate": {
      "filters": {
        "filters": {
          "errors": {
            "term": {
              "level": "error"
            }
          },
          "total": {
            "match_all": {}
          }
        }
      }
    }
  }
}
```

## 7. 监控最佳实践

### 1. 指标选择原则

- **关键业务指标**: 请求成功率、响应时间、吞吐量
- **系统资源指标**: CPU、内存、磁盘、网络使用率
- **应用特定指标**: 数据库连接池、队列长度、缓存命中率
- **错误追踪**: 错误率、异常类型、错误堆栈

### 2. 告警策略

- **分级告警**: Critical、Warning、Info 三级告警
- **告警抑制**: 避免告警风暴，设置合理的静默期
- **自动恢复**: 对于可自动恢复的问题，设置自动恢复告警
- **告警升级**: 关键告警设置升级机制，确保及时响应

### 3. 监控数据保留

- **指标数据**: 短期高精度 (7天)，中期低精度 (30天)，长期趋势 (1年)
- **日志数据**: 错误日志保留 30天，所有日志保留 7天
- **追踪数据**: 保留 7天，用于问题排查和性能分析

通过以上监控策略实施方案，LuLab 后端系统可以建立全面的监控体系，实现系统状态的实时监控、问题的快速定位和性能的持续优化。