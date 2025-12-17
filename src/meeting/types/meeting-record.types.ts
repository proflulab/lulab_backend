import {
  MeetingPlatform,
  MeetingType,
  ProcessingStatus,
} from '@prisma/client';

/**
 * 会议记录创建参数
 */
export interface CreateMeetingRecordParams {
  platform: MeetingPlatform;
  platformMeetingId: string;
  platformRecordingId: string;
  title: string;
  meetingCode: string;
  type: MeetingType;
  hostUserId: string;
  hostUserName: string;
  actualStartAt: Date;
  endedAt: Date;
  duration: number;
  hasRecording: boolean;
  recordingStatus: ProcessingStatus;
  processingStatus: ProcessingStatus;
  metadata?: any;
}

/**
 * 会议记录更新参数
 */
export interface UpdateMeetingRecordParams {
  recordingStatus?: ProcessingStatus;
  processingStatus?: ProcessingStatus;
  transcript?: string;
  summary?: string;
  participantCount?: number;
  participantList?: any;
}

/**
 * 会议记录查询参数
 */
export interface GetMeetingRecordsParams {
  platform?: MeetingPlatform;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

/**
 * 仓储层：会议记录创建数据（与数据库字段一致）
 */
export interface CreateMeetingRecordData {
  platform: MeetingPlatform;
  meetingId: string; // 改为 meetingId 以匹配模型
  title: string;
  meetingCode?: string;
  type: MeetingType;
  hostPlatformUserId?: string; // 改为 hostPlatformUserId 以匹配模型
  startTime?: Date;
  endTime?: Date;
  durationSeconds?: number;
  hasRecording?: boolean;
  recordingStatus?: ProcessingStatus;
  processingStatus?: ProcessingStatus;
  metadata?: any;
}

/**
 * 仓储层：会议记录更新数据（与服务层参数等价）
 */
export type UpdateMeetingRecordData = UpdateMeetingRecordParams;