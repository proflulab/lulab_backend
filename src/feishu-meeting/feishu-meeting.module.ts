/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-09-03 02:47:18
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-09-03 02:47:27
 * @FilePath: /lulab_backend/src/feishu_meeting/feishu-meeting.module.ts
 * @Description:
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */
import { Module } from '@nestjs/common';
import { FeishuWebhookController } from './feishu-webhook.controller';
import { FeishuWebhookHandler } from './feishu-webhook.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [FeishuWebhookController],
  providers: [FeishuWebhookHandler, PrismaService],
  exports: [FeishuWebhookHandler],
})
export class FeishuMeetingModule {}
