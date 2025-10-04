/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-07-06 05:06:37
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-10-03 06:34:37
 * @FilePath: /lulab_backend/src/app.module.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { PrismaModule } from './prisma/prisma.module';
import { MeetingModule } from './meeting/meeting.module';
import { TencentMeetingModule } from './hook-tencent-mtg/tencent-meeting.module';
import { LarkMeetingModule } from './lark-meeting/lark-meeting.module';
import { VerificationModule } from '@/verification/verification.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppResolver } from './app.resolver';
import { ScheduleModule } from '@nestjs/schedule';
import { OpenaiModule } from './integrations/openai/openai.module';
import { BullModule } from '@nestjs/bullmq';
import { redisConfig } from './configs';
import { TasksModule } from './task/tasks.module';

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
    BullModule.forRoot({
      connection: {
        host: redisConfig().host,
        port: redisConfig().port,
        password: redisConfig().password,
        db: redisConfig().db,
      },
    }),
    TasksModule,
    ScheduleModule.forRoot(),
    PrismaModule,
    MailModule,
    AuthModule,
    UserModule,
    MeetingModule,
    TencentMeetingModule,
    LarkMeetingModule,
    VerificationModule,
    OpenaiModule,
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
