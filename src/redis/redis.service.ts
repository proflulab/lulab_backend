/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-09-23 06:15:34
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-10-01 14:35:09
 * @FilePath: /lulab_backend/src/redis/redis.service.ts
 * @Description:
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import { Injectable, Logger, OnModuleDestroy, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { redisConfig } from '@/configs';
import Redis, { Redis as RedisClient } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client?: RedisClient;

  constructor(
    @Inject(redisConfig.KEY)
    private readonly config: ConfigType<typeof redisConfig>,
  ) {
    if (this.config.url) {
      // 如果存在 url，优先使用 URL 连接
      this.client = new Redis(this.config.url, {
        lazyConnect: false,
        enableAutoPipelining: true,
        maxRetriesPerRequest: 2,
      });
    } else {
      // 如果没有 url，使用独立的配置参数构建连接
      if (this.config.host && this.config.port) {
        this.client = new Redis({
          host: this.config.host,
          port: this.config.port,
          password: this.config.password || undefined,
          db: this.config.db,
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
      this.logger.warn(
        'Redis configuration not found; Redis features are disabled',
      );
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
