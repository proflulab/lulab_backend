/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-10-03 03:37:31
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-10-03 03:37:45
 * @FilePath: /lulab_backend/src/mail/mail.processor.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved. 
 */

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('mail')
export class MailProcessor extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === 'sendMail') {
      console.log(`📨 正在发送邮件给: ${job.data.email}`);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 模拟耗时
      console.log(`✅ 邮件发送完成: ${job.data.email}`);
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log(`🎉 任务完成: ${job.id}`);
  }
}
