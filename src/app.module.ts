/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-07-06 05:06:37
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-01 05:53:34
 * @FilePath: /lulab_backend/src/app.module.ts
 * @Description: Application module that defines the application's entry point and dependency injection
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
import { HookTencentMtgModule } from './hook-tencent-mtg/hook-tencent-mtg.module';
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
import { WinstonModule, utilities } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

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
    WinstonModule.forRootAsync({
      useFactory: () => ({
        level: 'debug',
        transports: [
          new winston.transports.DailyRotateFile({
            level: 'debug',
            dirname: 'daily-log',
            filename: 'log-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '10m',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.ms(),
              winston.format.printf((info) => {
                const { timestamp, level, context, message, ms } = info;
                const logData: Record<string, unknown> = {
                  pid: process.pid,
                  timestamp,
                  level,
                  context,
                  message,
                };
                if (ms) logData.ms = ms;
                return JSON.stringify(logData);
              }),
            ),
          }),
          // new winston.transports.File({
          //   filename: `${process.cwd()}/log`,
          // }),
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.timestamp(),
              utilities.format.nestLike(),
            ),
          }),
        ],
      }),
    }),
    TasksModule,
    ScheduleModule.forRoot(),
    PrismaModule,
    MailModule,
    AuthModule,
    UserModule,
    MeetingModule,
    HookTencentMtgModule,
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
