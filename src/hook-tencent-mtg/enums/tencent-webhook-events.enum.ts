/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-11-24 00:34:32
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-11-24 00:34:44
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/enums/tencent-webhook-events.enum.ts
 * @Description:
 *  *
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
  MEETING_UPDATE = 'meeting.update',
  MEETING_DELETE = 'meeting.delete',
  SUB_MEETING_START = 'sub_meeting.start',
  SUB_MEETING_END = 'sub_meeting.end',
}
