/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-17 16:40:04
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-17 19:00:11
 * @FilePath: /lulab_backend/prisma.config.ts
 * @Description: Prisma 配置文件
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
