/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-18 20:10:49
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-18 20:16:57
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/types/tencent-base.types.ts
 * @Description: 腾讯会议基础类型定义
 * 
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved. 
 */

// 腾讯会议事件操作者信息
export interface TencentEventOperator {
  userid: string; // 事件操作者 id（同企业用户才返回用户 id，OAuth 用户返回 openId,rooms 返回 roomsId）
  open_id?: string;
  uuid: string; // 用户身份 ID
  user_name: string; // 事件操作者名称
  ms_open_id?: string;
  instance_id: string; // 用户的终端设备类型
}

// 腾讯会议创建者信息
export interface TencentMeetingCreator {
  userid: string; // 创建人 id（OAuth 用户返回 openId）
  open_id?: string;
  uuid: string; // 用户身份 ID
  user_name: string; // 创建人名称
  ms_open_id?: string;
  instance_id?: string; // 用户的终端设备类型
}

// 腾讯会议主持人信息
export interface TencentMeetingHost {
  userid: string; // 用户 id（OAuth 用户返回 openId）
  open_id?: string;
  uuid: string; // 用户身份 ID
  user_name: string; // 用户名称
  ms_open_id?: string;
}

// 会议类型枚举
export enum TencentMeetingType {
  ONE_TIME = 0, // 一次性会议
  RECURRING = 1, // 周期性会议
  WECHAT_EXCLUSIVE = 2, // 微信专属会议
  ROOMS_SCREEN_SHARE = 4, // rooms 投屏会议
  PERSONAL_MEETING_ID = 5, // 个人会议号会议
}

// 会议创建类型枚举
export enum TencentMeetingCreateMode {
  NORMAL = 0, // 普通会议
  QUICK = 1, // 快速会议
}

// 会议创建来源枚举
export enum TencentMeetingCreateFrom {
  EMPTY = 0, // 空来源
  CLIENT = 1, // 客户端
  WEB = 2, // web
  WECHAT_WORK = 3, // 企微
  WECHAT = 4, // 微信
  OUTLOOK = 5, // outlook
  REST_API = 6, // restapi
  TENCENT_DOCS = 7, // 腾讯文档
  ROOMS_SMART_RECORDING = 8, // Rooms 智能录制
}

// 会议ID类型枚举
export enum TencentMeetingIdType {
  MAIN = 0, // 主会议 ID
  BREAKOUT = 1, // 分组会议 ID
}

// 终端设备类型枚举
export enum TencentInstanceType {
  UNKNOWN = 0, // 未知设备
  PC = 1, // PC端
  MOBILE = 2, // 移动端
  WEB = 3, // Web端
  ROOMS = 4, // Rooms设备
  PHONE = 5, // 电话接入
  OUTDOOR = 6, // 户外设备
}

// 会议结束类型枚举
export enum TencentMeetingEndType {
  ACTIVE_END = 0, // 主动结束会议
  LAST_USER_LEAVE_AFTER_END = 1, // 最后一个参会用户离开会议且超过了预定会议结束时间
  NO_USER_AFTER_END = 2, // 会议中无人且超过了预定会议结束时间
  NO_USER_BEFORE_END = 3, // 会议中无人且未到会议预定结束时间
}

// 腾讯会议信息
export interface TencentEventMeetingInfo {
  meeting_id: string; // 会议 ID
  meeting_code: string; // 会议 code
  subject: string; // 会议主题
  creator: TencentMeetingCreator;
  hosts?: TencentMeetingHost[]; // 主持人（某些事件类型包含）
  meeting_type: TencentMeetingType; // 会议类型
  start_time: number; // 秒级别的会议开始时间戳
  end_time: number; // 秒级别的会议结束时间戳
  meeting_create_mode?: TencentMeetingCreateMode; // 会议创建类型
  meeting_create_from?: TencentMeetingCreateFrom; // 会议创建来源
  meeting_id_type?: TencentMeetingIdType; // 会议 ID 类型
  sub_meeting_id?: string; // 子会议 ID（周期性会议时使用）
  sub_meeting_start_time?: number; // 子会议开始时间戳（周期性会议时使用）
  sub_meeting_end_time?: number; // 子会议结束时间戳（周期性会议时使用）
}

// 录制文件信息
export interface TencentRecordingFile {
  record_file_id: string; // 录制文件ID
}