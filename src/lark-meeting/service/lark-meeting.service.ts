/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-11-23 11:04:45
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-11-23 11:18:42
 * @FilePath: /lulab_backend/src/lark-meeting/service/lark-meeting.service.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

// src/lark-meeting/service/lark-meeting.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { MeetingBitableRepository } from '@/integrations/lark';
import { MeetingEndedEventData } from '../types/lark-meeting.types';
import { toMs } from '../time.util';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { LarkEvent } from '../enums/lark-event.enum';

@Injectable()
export class LarkMeetingService {
  private readonly logger = new Logger(LarkMeetingService.name);

  constructor(
    private readonly meetingBitable: MeetingBitableRepository,
    @InjectQueue('lark-events') private readonly queue: Queue,
  ) {}

  async enqueueMeetingEnded(data: MeetingEndedEventData): Promise<void> {
    await this.queue.add('meetingEnded', data, {
      removeOnComplete: { age: 3600, count: 1000 },
      removeOnFail: { age: 24 * 3600, count: 1000 },
    });
  }

  async handleMeetingEnded(data: MeetingEndedEventData): Promise<void> {
    const meetingId = data?.meeting?.id;
    this.logger.log({
      event: 'meeting_ended',
      event_type: LarkEvent.VC_MEETING_ALL_ENDED_V1,
      meeting_id: meetingId,
    });
    if (!meetingId) return;

    const m = data.meeting;
    const startTime = toMs(m.start_time);
    const endTime = toMs(m.end_time);

    await this.meetingBitable
      .upsertMeetingRecord({
        platform: '飞书会议',
        meeting_id: m.id,
        ...(m.topic && { subject: m.topic }),
        ...(m.meeting_no && { meeting_code: m.meeting_no }),
        ...(startTime !== undefined && { start_time: startTime }),
        ...(endTime !== undefined && { end_time: endTime }),
      })
      .catch((err) => this.logger.error('upsertMeetingRecord_failed', err));
  }
}
