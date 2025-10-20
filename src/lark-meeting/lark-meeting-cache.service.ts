import { Injectable, Logger } from '@nestjs/common';

export interface MeetingMetaCache {
  topic?: string;
  meetingNo?: string | number;
  startTime?: string | number;
  endTime?: string | number;
}

export interface MeetingDetailCache {
  meeting_end_time?: string | number;
  meeting_id?: string;
  meeting_instance_id?: string;
  meeting_start_time?: string | number;
  meeting_no?: string | number;
  organizer?: any;
  user_id?: string;
}

@Injectable()
export class LarkMeetingCacheService {
  private readonly logger = new Logger(LarkMeetingCacheService.name);

  // 处理状态：避免对同一个 minuteToken 重复处理
  private readonly processingMinuteTokens = new Set<string>();
  // 会议元数据缓存
  private readonly lastMeetingMetaById = new Map<string, MeetingMetaCache>();
  // 会议详情缓存
  private readonly lastMeetingDetailById = new Map<
    string,
    MeetingDetailCache
  >();

  // ===== Minute token 处理集合 =====
  isProcessingMinuteToken(token: string): boolean {
    return this.processingMinuteTokens.has(token);
  }

  markProcessingMinuteToken(token: string): void {
    this.processingMinuteTokens.add(token);
  }

  clearProcessingMinuteToken(token: string): void {
    this.processingMinuteTokens.delete(token);
  }

  // ===== 会议元数据缓存 =====
  setMeetingMeta(meetingId: string, meta: MeetingMetaCache): void {
    this.lastMeetingMetaById.set(meetingId, meta);
    this.logger.debug('Cached meeting meta', { meetingId, meta });
  }

  getMeetingMeta(meetingId: string): MeetingMetaCache | undefined {
    return this.lastMeetingMetaById.get(meetingId);
  }

  clearMeetingMeta(meetingId: string): void {
    this.lastMeetingMetaById.delete(meetingId);
  }

  // ===== 会议详情缓存 =====
  setMeetingDetail(meetingId: string, detail: MeetingDetailCache): void {
    this.lastMeetingDetailById.set(meetingId, detail);
    this.logger.debug('Cached meeting detail', { meetingId, detail });
  }

  getMeetingDetail(meetingId: string): MeetingDetailCache | undefined {
    return this.lastMeetingDetailById.get(meetingId);
  }

  clearMeetingDetail(meetingId: string): void {
    this.lastMeetingDetailById.delete(meetingId);
  }
}
