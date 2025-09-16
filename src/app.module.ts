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
import { PrismaModule } from './prisma.module';
import { MeetingModule } from './meeting/meeting.module';
import { TencentMeetingModule } from './tencent-meeting/tencent-meeting.module';
import { LarkMeetingModule } from './lark-meeting/lark-meeting.module';
import { VerificationModule } from '@/verification/verification.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppResolver } from './app.resolver';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: true,
      introspection: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    EmailModule,
    AuthModule,
    UserModule,
    MeetingModule,
    TencentMeetingModule,
    LarkMeetingModule,
    VerificationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppResolver,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
