import {
  MeetingPlatform,
  MeetingType,
  FileType,
  StorageType,
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
 * 会议文件创建参数
 */
export interface CreateMeetingFileParams {
  meetingRecordId: string;
  fileName: string;
  fileType: FileType;
  storageType: StorageType;
  downloadUrl?: string;
  content?: string;
  mimeType: string;
  processingStatus: ProcessingStatus;
}

// Repository-layer alias for creating meeting file
export type CreateMeetingFileData = CreateMeetingFileParams;

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
  platformMeetingId: string;
  title: string;
  meetingCode: string;
  type: MeetingType;
  hostUserId: string;
  hostUserName: string;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  hasRecording: boolean;
  recordingStatus: ProcessingStatus;
  processingStatus: ProcessingStatus;
  metadata?: any;
}

/**
 * 仓储层：会议记录更新数据（与服务层参数等价）
 */
export type UpdateMeetingRecordData = UpdateMeetingRecordParams;

/**
 * 仓储层：会议文件更新数据
 */
export interface UpdateMeetingFileData {
  fileName?: string;
  content?: string;
  processingStatus?: ProcessingStatus;
  metadata?: any;
}

/**
 * 平台事件数据接口
 */
export interface PlatformEventData {
  event: string;
  platform: MeetingPlatform;
  payload: any;
}

/**
 * Webhook验证参数
 */
export interface WebhookVerificationParams {
  timestamp: string;
  nonce: string;
  signature: string;
  data: string;
}

/**
 * URL验证参数
 */
export interface UrlVerificationParams {
  checkStr: string;
  timestamp: string;
  nonce: string;
  signature: string;
}
