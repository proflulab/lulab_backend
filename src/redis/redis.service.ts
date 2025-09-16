import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { Redis as RedisClient } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client?: RedisClient;
  private readonly url?: string;

  constructor(private readonly config: ConfigService) {
    this.url = this.config.get<string>('REDIS_URL');
    if (this.url) {
      this.client = new Redis(this.url, {
        lazyConnect: false,
        enableAutoPipelining: true,
        maxRetriesPerRequest: 2,
      });
      this.client.on('error', (err) =>
        this.logger.error(`Redis error: ${err.message}`),
      );
      this.client.on('connect', () => this.logger.log('Redis connected'));
      this.client.on('reconnecting', () =>
        this.logger.warn('Redis reconnecting...'),
      );
    } else {
      this.logger.warn('REDIS_URL not set; Redis features are disabled');
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
