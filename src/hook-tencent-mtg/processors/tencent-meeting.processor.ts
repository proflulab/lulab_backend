/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-11-26 20:41:44
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-11-30 04:52:37
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/processors/tencent-meeting.processor.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { MeetingUserBitableRepository } from '@/integrations/lark/repositories';
import { MeetingUserData } from '@/integrations/lark/types';

@Injectable()
@Processor('tencent-mtg')
export class TencentMeetingProcessor extends WorkerHost {
  private readonly logger = new Logger(TencentMeetingProcessor.name);

  constructor(
    private readonly meetingUserBitable: MeetingUserBitableRepository,
  ) {
    super();
  }

  override async process(
    job: Job<MeetingUserData, unknown, string>,
  ): Promise<unknown> {
    if (job.name === 'upsertMeetingUser') {
      const res = await this.meetingUserBitable.upsertMeetingUserRecord(
        job.data,
      );
      const recordId = res.data?.record?.record_id;
      if (recordId) {
        this.logger.log(`操作者记录ID: ${recordId}`);
      }
      this.logger.log(
        `成功处理用户信息: ${job.data.user_name} (${job.data.uuid})`,
      );
    }
    return { ok: true };
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<MeetingUserData>, err: Error) {
    this.logger.error(`处理用户信息失败: ${job.data.uuid}`, err);
  }
}
