/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-11-24 01:17:14
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-11-24 01:18:18
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/services/tencent-meeting-queue.service.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue, JobsOptions } from 'bullmq';

export interface UpsertMeetingUserJobData {
  uuid: string;
  userid?: string;
  user_name: string;
  is_enterprise_user: boolean;
}

@Injectable()
export class TencentMeetingQueueService {
  constructor(@InjectQueue('tencent-mtg') private readonly queue: Queue) {}

  async enqueueUpsertMeetingUser(data: UpsertMeetingUserJobData) {
    const opts: JobsOptions = {
      removeOnComplete: { age: 3600, count: 1000 },
      removeOnFail: { age: 24 * 3600, count: 1000 },
    };
    await this.queue.add('upsertMeetingUser', data, opts);
  }
}
