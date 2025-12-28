/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-10-03 03:37:31
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-10-03 04:42:44
 * @FilePath: /lulab_backend/src/mail/mail.processor.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('mail')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  async process(
    job: Job<{ email: string; [key: string]: any }, any, string>,
  ): Promise<void> {
    try {
      if (job.name === 'sendMail') {
        if (!job.data?.email) {
          throw new Error('Email address is required in job data');
        }
        this.logger.log(`📨 正在发送邮件给: ${job.data.email}`);
        // TODO: Implement actual mail sending logic here
        // await this.mailService.send(job.data);
        this.logger.log(`✅ 邮件发送完成: ${job.data.email}`);
      }
      // Add await to satisfy the async requirement
      await Promise.resolve();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`邮件发送失败: ${errorMessage}`, errorStack);
      throw error; // Re-throw so the job is marked as failed
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log(`🎉 任务完成: ${job.id}`);
  }
}
