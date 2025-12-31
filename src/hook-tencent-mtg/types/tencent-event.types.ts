/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-18 20:10:49
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-31 11:50:19
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/types/tencent-event.types.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import {
  TencentMeetingType,
  TencentMeetingCreateMode,
  TencentMeetingCreateFrom,
  TencentMeetingIdType,
  TencentMeetingEndType,
} from '../enums/tencent-base.enum';

// 腾讯会议信息
export interface TencentEventMeetingInfo {
  meeting_id: string; // 会议ID
  meeting_code: string; // 会议号
  subject: string; // 会议主题
  creator: TencentMeetingCreator; // 创建者信息
  hosts?: TencentMeetingHost[]; // 主持人列表
  meeting_type: TencentMeetingType; // 会议类型
  start_time: number; // 开始时间（秒级时间戳）
  end_time: number; // 结束时间（秒级时间戳）
  meeting_create_mode?: TencentMeetingCreateMode; // 会议创建模式
  meeting_create_from?: TencentMeetingCreateFrom; // 会议创建来源
  meeting_id_type?: TencentMeetingIdType; // 会议ID类型
  sub_meeting_id?: string; // 子会议ID
  sub_meeting_start_time?: number; // 子会议开始时间（秒级时间戳）
  sub_meeting_end_time?: number; // 子会议结束时间（秒级时间戳）
  action_scene_type?: number; // 操作场景类型
  media_set_type?: number; // 媒体集类型
}

// 腾讯会议事件
export interface TencentMeetingEvent {
  event: string; // 事件名
  trace_id: string; // 事件的唯一序列值
  payload: TencentEventPayload[]; // 事件载荷
  result?: number; // 结果（smart事件特有）
}

// 腾讯会议事件载荷
export interface TencentEventPayload {
  operate_time: number; // 操作时间（毫秒级时间戳）
  operator?: TencentEventOperator; // 事件操作者（某些事件可能没有）
  meeting_info?: TencentEventMeetingInfo; // 会议信息（某些事件可能没有）
  meeting_end_type?: TencentMeetingEndType; // 结束类型（仅 meeting.end 事件）
  recording_files?: TencentRecordingFile[]; // 录制文件（recording 和 smart 事件）
}

// 腾讯会议事件操作者信息
export interface TencentEventOperator {
  userid?: string; // 用户ID
  open_id?: string; // 开放ID
  uuid?: string; // 用户唯一标识
  user_name?: string; // 用户名称
  nick_name?: string; // 用户昵称
  ms_open_id?: string; // 微信开放ID
  instance_id: string; // 实例ID
}

// 腾讯会议创建者信息
export interface TencentMeetingCreator {
  userid: string; // 用户ID
  open_id?: string; // 开放ID
  uuid: string; // 用户唯一标识
  user_name: string; // 用户名称
  ms_open_id?: string; // 该会议用户ID
  instance_id?: string; // 实例ID
}

// 腾讯会议主持人信息
export interface TencentMeetingHost {
  userid: string; // 用户ID
  open_id?: string; // 开放ID
  uuid: string; // 用户唯一标识
  user_name: string; // 用户名称
  ms_open_id?: string; // 该会议用户ID
}

// 录制文件信息
export interface TencentRecordingFile {
  record_file_id: string; // 录制文件ID
  lang?: string; // 语言
}
