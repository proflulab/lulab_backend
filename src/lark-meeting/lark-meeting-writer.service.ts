import { Injectable, Logger } from '@nestjs/common';
import { MeetingBitableRepository } from '@lark/repositories';
import { MeetingData } from '@lark/types';

export interface MeetingMetaInput {
  topic?: string;
  meetingNo?: string | number;
  startTime?: string | number;
  endTime?: string | number;
}

export interface MeetingDetailInput {
  meeting_end_time?: string | number;
  meeting_id?: string;
  meeting_instance_id?: string;
  meeting_start_time?: string | number;
  meeting_no?: string | number;
  organizer?: any;
  user_id?: string;
  participants?: Array<{ id?: string; name?: string } | string>;
  meeting_type?: string | string[];
}

@Injectable()
export class LarkMeetingWriterService {
  private readonly logger = new Logger(LarkMeetingWriterService.name);

  constructor(
    private readonly meetingRepo: MeetingBitableRepository,
  ) {}

  private toNum(value?: string | number): number | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'number') return value;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  private toString(value?: string | number): string | undefined {
    if (value === undefined || value === null) return undefined;
    return String(value);
  }

  /**
   * 通用写入：直接依据 MeetingData 写入（upsert）
   */
  async upsertMeeting(data: MeetingData) {
    this.logger.debug('Upserting meeting record to Bitable', {
      meeting_id: data.meeting_id,
    });
    return this.meetingRepo.upsertMeetingRecord(data);
  }

  /**
   * 依据事件缓存的 meta/detail 写入（upsert）到 meeting 表
   * - 优先使用 detail 的时间字段；回退到 meta 的时间字段
   * - 平台固定为“飞书”
   * - 可选填充 subject、meeting_code、operator、creator、participants、meeting_type
   */
  async upsertFromEvent(
    meetingId: string,
    meta?: MeetingMetaInput,
    detail?: MeetingDetailInput,
  ) {
    const startTime =
      this.toNum(detail?.meeting_start_time) ?? this.toNum(meta?.startTime);
    const endTime =
      this.toNum(detail?.meeting_end_time) ?? this.toNum(meta?.endTime);

    const subject = meta?.topic;
    const meetingCode =
      this.toString(detail?.meeting_no) ??
      this.toString(meta?.meetingNo) ??
      this.toString(detail?.meeting_id);

    // operator：尽量收集事件中的操作者/组织者ID
    const operator: string[] = [];
    if (detail?.user_id) operator.push(detail.user_id);
    const organizerId = detail?.organizer?.id?.user_id || detail?.organizer?.user_id;
    if (organizerId) operator.push(String(organizerId));

    // creator：如有可用字段则填充（目前与 operator 等价处理）
    const creator: string[] = organizerId ? [String(organizerId)] : [];

    // participants：兼容传入的多种形式
    const participants: string[] = [];
    if (detail?.participants && Array.isArray(detail.participants)) {
      for (const p of detail.participants) {
        if (typeof p === 'string') participants.push(p);
        else if (p?.id) participants.push(String(p.id));
      }
    }

    // meeting_type：支持单值或数组
    const meetingTypeArray: string[] = [];
    if (detail?.meeting_type) {
      const mt = detail.meeting_type;
      if (Array.isArray(mt)) meetingTypeArray.push(...mt.map(String));
      else meetingTypeArray.push(String(mt));
    }

    const record: MeetingData = {
      platform: '飞书会议',
      meeting_id: meetingId,
      ...(subject && { subject }),
      ...(meetingCode && { meeting_code: meetingCode }),
      ...(startTime !== undefined && { start_time: startTime }),
      ...(endTime !== undefined && { end_time: endTime }),
      ...(operator.length > 0 && { operator }),
      ...(creator.length > 0 && { creator }),
      ...(participants.length > 0 && { participants }),
      ...(meetingTypeArray.length > 0 && { meeting_type: meetingTypeArray }),
    };

    return this.upsertMeeting(record);
  }
}