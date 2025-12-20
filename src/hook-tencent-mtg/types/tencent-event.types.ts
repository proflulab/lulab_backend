/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-18 20:10:49
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-18 20:15:14
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/types/tencent-event.types.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import {
  TencentEventOperator,
  TencentEventMeetingInfo,
  TencentMeetingEndType,
  TencentRecordingFile,
} from './tencent-base.types';

// 腾讯会议事件
export interface TencentMeetingEvent {
  event: string; // 事件名
  trace_id: string; // 事件的唯一序列值
  payload: TencentEventPayload[];
}

// 腾讯会议事件载荷
export interface TencentEventPayload {
  operate_time: number; // 毫秒级别事件操作时间戳
  operator: TencentEventOperator; // 事件操作者
  meeting_info: TencentEventMeetingInfo; // 会议信息
  meeting_end_type?: TencentMeetingEndType; // 结束类型（仅 meeting.end 事件）
  recording_files?: TencentRecordingFile[]; // 录制文件（某些事件类型包含）
}

// 腾讯会议事件类型枚举
export enum TencentMeetingEventType {
  MEETING_START = 'meeting.start',
  MEETING_END = 'meeting.end',
  MEETING_JOIN = 'meeting.join',
  MEETING_LEAVE = 'meeting.leave',
  RECORDING_START = 'recording.start',
  RECORDING_END = 'recording.end',
  RECORDING_READY = 'recording.ready',
  MEETING_UPDATE = 'meeting.update', // 会议更新事件
  MEETING_DELETE = 'meeting.delete', // 会议删除事件
  SUB_MEETING_START = 'sub_meeting.start', // 子会议开始（周期性会议）
  SUB_MEETING_END = 'sub_meeting.end', // 子会议结束（周期性会议）
}

// 腾讯会议事件处理器接口
export interface TencentMeetingEventHandler {
  handle(event: TencentMeetingEvent): Promise<void>;
  supports(eventType: string): boolean;
}
