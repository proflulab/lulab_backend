/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-11-26 20:41:44
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-05 22:53:57
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/processors/tencent-meeting.processor.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { MeetingUserData, MeetingData } from '@/integrations/lark/types';
import {
  MeetingUserBitableRepository,
  MeetingBitableRepository,
} from '@/integrations/lark/repositories';

@Injectable()
@Processor('tencent-mtg')
export class TencentMeetingProcessor extends WorkerHost {
  private readonly logger = new Logger(TencentMeetingProcessor.name);

  constructor(
    private readonly meetingUserBitable: MeetingUserBitableRepository,
    private readonly meetingBitable: MeetingBitableRepository,
  ) {
    super();
  }

  override async process(job: Job<any, unknown, string>): Promise<unknown> {
    switch (job.name) {
      case 'upsertMeetingUser': {
        const data = job.data as MeetingUserData;
        const res = await this.meetingUserBitable.upsertMeetingUserRecord(data);
        const recordId = res.data?.record?.record_id;
        if (recordId) {
          this.logger.log(`操作者记录ID: ${recordId}`);
        }
        this.logger.log(`成功处理用户信息: ${data.user_name} (${data.uuid})`);
        break;
      }

      case 'upsertMeetingRecord': {
        const data = job.data as MeetingData;
        const res = await this.meetingBitable.upsertMeetingRecord(data);
        const recordId = res.data?.record?.record_id;
        if (recordId) {
          this.logger.log(`会议记录ID: ${recordId}`);
        }
        this.logger.log(
          `成功处理会议记录: ${data.meeting_id} (${data.subject})`,
        );
        break;
      }

      default:
        this.logger.warn(`未知的任务类型: ${job.name}`);
    }
    return { ok: true };
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<any>, err: Error) {
    switch (job.name) {
      case 'upsertMeetingUser': {
        const data = job.data as MeetingUserData;
        this.logger.error(`处理用户信息失败: ${data.uuid}`, err);
        break;
      }

      case 'upsertMeetingRecord': {
        const data = job.data as MeetingData;
        this.logger.error(`处理会议记录失败: ${data.meeting_id}`, err);
        break;
      }

      default:
        this.logger.error(`Job ${job.name} failed`, err);
    }
  }
}
