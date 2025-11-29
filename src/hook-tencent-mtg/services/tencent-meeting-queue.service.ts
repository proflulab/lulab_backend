/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-11-24 01:17:14
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-11-30 04:52:15
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/services/tencent-meeting-queue.service.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue, JobsOptions } from 'bullmq';
import { MeetingUserData } from '@/integrations/lark/types';

@Injectable()
export class TencentMeetingQueueService {
  constructor(@InjectQueue('tencent-mtg') private readonly queue: Queue) {}

  async enqueueUpsertMeetingUser(data: MeetingUserData) {
    const opts: JobsOptions = {
      removeOnComplete: { age: 3600, count: 1000 },
      removeOnFail: { age: 24 * 3600, count: 1000 },
    };
    await this.queue.add('upsertMeetingUser', data, opts);
  }
}
