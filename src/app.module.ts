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
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { JwtAuthGuard } from '@libs/security';
import { PrismaService } from './prisma.service';
import { MeetingModule } from './meeting/meeting.module';
import { TencentMeetingModule } from './tencent-meeting/tencent-meeting.module';
import { FeishuMeetingModule } from './feishu-meeting/feishu-meeting.module';
import { VerificationModule } from '@/verification/verification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EmailModule,
    AuthModule,
    UserModule,
    MeetingModule,
    TencentMeetingModule,
    FeishuMeetingModule,
    VerificationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
