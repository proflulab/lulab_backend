/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-10-01 06:34:08
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-10-02 02:56:39
 * @FilePath: /lulab_backend/src/configs/redis.config.ts
 * @Description:
 *
 * Copyright (c) 2025 by 杨仕明 shiming.y@qq.com, All Rights Reserved.
 */

/**
 * Redis Configuration
 * Configuration for Redis connection settings
 */
import { registerAs, ConfigType } from '@nestjs/config';

export const redisConfig = registerAs('redis', () => ({
  url: process.env.REDIS_URL ?? '',
  host: process.env.REDIS_HOST ?? 'localhost',
  port: (() => {
    const port = parseInt(process.env.REDIS_PORT ?? '6379', 10);
    if (isNaN(port) || port <= 0 || port > 65535) {
      throw new Error('REDIS_PORT must be a valid port number');
    }
    return port;
  })(),
  password: process.env.REDIS_PASSWORD ?? '',
  db: (() => {
    const db = parseInt(process.env.REDIS_DB ?? '0', 10);
    if (isNaN(db) || db < 0) {
      throw new Error('REDIS_DB must be a non-negative integer');
    }
    return db;
  })(),
}));

export type RedisConfig = ConfigType<typeof redisConfig>;
