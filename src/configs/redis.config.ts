/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-10-01 06:34:08
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-10-01 06:34:34
 * @FilePath: /lulab_backend/src/configs/redis.config.ts
 * @Description:
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */
/**
 * Redis Configuration
 * Configuration for Redis connection settings
 */
import { registerAs, ConfigType } from '@nestjs/config';

export const redisConfig = registerAs('redis', () => ({
  url: process.env.REDIS_URL ?? '',
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD ?? '',
  db: parseInt(process.env.REDIS_DB ?? '0', 10),
}));

export type RedisConfig = ConfigType<typeof redisConfig>;
