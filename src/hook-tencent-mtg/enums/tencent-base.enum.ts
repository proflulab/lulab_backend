/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-18 20:10:49
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-31 11:35:50
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/types/enums/tencent-base.enum.ts
 * @Description: 腾讯会议基础枚举定义
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

export enum TencentMeetingType {
  ONE_TIME = 0,
  RECURRING = 1,
  WECHAT_EXCLUSIVE = 2,
  ROOMS_SCREEN_SHARE = 4,
  PERSONAL_MEETING_ID = 5,
}

export enum TencentMeetingCreateMode {
  NORMAL = 0,
  QUICK = 1,
}

export enum TencentMeetingCreateFrom {
  EMPTY = 0,
  CLIENT = 1,
  WEB = 2,
  WECHAT_WORK = 3,
  WECHAT = 4,
  OUTLOOK = 5,
  REST_API = 6,
  TENCENT_DOCS = 7,
  ROOMS_SMART_RECORDING = 8,
}

export enum TencentMeetingIdType {
  MAIN = 0,
  BREAKOUT = 1,
}

export enum TencentInstanceType {
  UNKNOWN = 0,
  PC = 1,
  MOBILE = 2,
  WEB = 3,
  ROOMS = 4,
  PHONE = 5,
  OUTDOOR = 6,
}

export enum TencentMeetingEndType {
  ACTIVE_END = 0,
  LAST_USER_LEAVE_AFTER_END = 1,
  NO_USER_AFTER_END = 2,
  NO_USER_BEFORE_END = 3,
}

export enum TencentMeetingEventType {
  MEETING_START = 'meeting.start',
  MEETING_END = 'meeting.end',
  MEETING_JOIN = 'meeting.join',
  MEETING_LEAVE = 'meeting.leave',
  RECORDING_START = 'recording.start',
  RECORDING_END = 'recording.end',
  RECORDING_READY = 'recording.ready',
  SMART_FULLSUMMARY = 'smart.fullsummary',
  SMART_TRANSCRIPTS = 'smart.transcripts',
  MEETING_UPDATE = 'meeting.update',
  MEETING_DELETE = 'meeting.delete',
  SUB_MEETING_START = 'sub_meeting.start',
  SUB_MEETING_END = 'sub_meeting.end',
}
