import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { Redis as RedisClient } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client?: RedisClient;

  constructor(private readonly config: ConfigService) {
    const redisUrl = this.config.get<string>('REDIS_URL');
    
    if (redisUrl) {
      // 如果存在 REDIS_URL，优先使用 URL 连接
      this.client = new Redis(redisUrl, {
        lazyConnect: false,
        enableAutoPipelining: true,
        maxRetriesPerRequest: 2,
      });
    } else {
      // 如果没有 REDIS_URL，使用独立的配置参数构建连接
      const host = this.config.get<string>('REDIS_HOST') || 'localhost';
      const port = this.config.get<number>('REDIS_PORT') || 6379;
      const password = this.config.get<string>('REDIS_PASSWORD');
      const db = this.config.get<number>('REDIS_DB') || 0;

      if (host && port) {
        this.client = new Redis({
          host,
          port,
          password: password || undefined,
          db,
          lazyConnect: false,
          enableAutoPipelining: true,
          maxRetriesPerRequest: 2,
        });
      }
    }

    if (this.client) {
      this.client.on('error', (err) =>
        this.logger.error(`Redis error: ${err.message}`),
      );
      this.client.on('connect', () => this.logger.log('Redis connected'));
      this.client.on('reconnecting', () =>
        this.logger.warn('Redis reconnecting...'),
      );
    } else {
      this.logger.warn('Redis configuration not found; Redis features are disabled');
    }
  }

  // Whether a usable Redis connection is ready
  isReady(): boolean {
    return !!this.client && this.client.status === 'ready';
  }

  getClient(): RedisClient | undefined {
    return this.client;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) await this.client.quit();
  }
}
