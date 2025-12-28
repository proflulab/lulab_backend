/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-09-23 06:15:34
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-10-01 14:02:23
 * @FilePath: /lulab_backend/src/integrations/email/email.module.ts
 * @Description: 邮件模块
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailerService } from './mailer.service';
import { emailConfig } from '@/configs/email.config';

@Module({
  imports: [ConfigModule.forFeature(emailConfig)],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}
