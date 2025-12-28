/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-27 05:27:02
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-03 03:43:52
 * @FilePath: /lulab_backend/src/prisma/prisma.service.ts
 * @Description:
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });
    super({ adapter });
  }
}
