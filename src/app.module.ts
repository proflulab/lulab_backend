/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-07-06 05:06:37
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-07-06 05:12:42
 * @FilePath: /lulab_backend/src/app.module.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailModule } from './email/email.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [ConfigModule.forRoot(), EmailModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule { }
