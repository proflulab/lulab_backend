import {
  TencentMeetingType,
  TencentMeetingCreateMode,
  TencentMeetingCreateFrom,
  TencentMeetingIdType,
  TencentInstanceType,
  TencentMeetingEndType,
  TencentMeetingEventType,
} from '../enums/tencent-webhook-events.enum';

// 腾讯会议事件相关类型定义

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
// 会议创建类型枚举
// 会议创建来源枚举
// 会议ID类型枚举
// 终端设备类型枚举

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

// 会议结束类型枚举

// 录制文件信息
export interface TencentRecordingFile {
  record_file_id: string; // 录制文件ID
}

// 腾讯会议事件载荷
export interface TencentEventPayload {
  operate_time: number; // 毫秒级别事件操作时间戳
  operator: TencentEventOperator; // 事件操作者
  meeting_info: TencentEventMeetingInfo; // 会议信息
  meeting_end_type?: TencentMeetingEndType; // 结束类型（仅 meeting.end 事件）
  recording_files?: TencentRecordingFile[]; // 录制文件（某些事件类型包含）
}

// 腾讯会议事件
export interface TencentMeetingEvent {
  event: string; // 事件名
  trace_id: string; // 事件的唯一序列值
  payload: TencentEventPayload[];
}

// 腾讯会议事件类型枚举

// 腾讯会议事件处理器接口
export interface TencentMeetingEventHandler {
  handle(event: TencentMeetingEvent): Promise<void>;
  supports(eventType: string): boolean;
}

// 类型工具函数
export class TencentMeetingEventUtils {
  /**
   * 判断是否为周期性会议
   */
  static isRecurringMeeting(meetingInfo: TencentEventMeetingInfo): boolean {
    return meetingInfo.meeting_type === TencentMeetingType.RECURRING;
  }

  /**
   * 判断是否为子会议
   */
  static isSubMeeting(meetingInfo: TencentEventMeetingInfo): boolean {
    return (
      meetingInfo.meeting_id_type === TencentMeetingIdType.BREAKOUT ||
      !!meetingInfo.sub_meeting_id
    );
  }

  /**
   * 获取会议的实际开始时间
   * 对于子会议，返回子会议开始时间；否则返回主会议开始时间
   */
  static getActualStartTime(meetingInfo: TencentEventMeetingInfo): number {
    return meetingInfo.sub_meeting_start_time || meetingInfo.start_time;
  }

  /**
   * 获取会议的实际结束时间
   * 对于子会议，返回子会议结束时间；否则返回主会议结束时间
   */
  static getActualEndTime(meetingInfo: TencentEventMeetingInfo): number {
    return meetingInfo.sub_meeting_end_time || meetingInfo.end_time;
  }

  /**
   * 获取会议创建来源的描述文本
   */
  static getCreateFromDescription(
    createFrom: TencentMeetingCreateFrom,
  ): string {
    switch (createFrom) {
      case TencentMeetingCreateFrom.EMPTY:
        return '空来源';
      case TencentMeetingCreateFrom.CLIENT:
        return '客户端';
      case TencentMeetingCreateFrom.WEB:
        return 'Web端';
      case TencentMeetingCreateFrom.WECHAT_WORK:
        return '企业微信';
      case TencentMeetingCreateFrom.WECHAT:
        return '微信';
      case TencentMeetingCreateFrom.OUTLOOK:
        return 'Outlook';
      case TencentMeetingCreateFrom.REST_API:
        return 'REST API';
      case TencentMeetingCreateFrom.TENCENT_DOCS:
        return '腾讯文档';
      case TencentMeetingCreateFrom.ROOMS_SMART_RECORDING:
        return 'Rooms智能录制';
      default:
        return '未知来源';
    }
  }

  /**
   * 获取会议类型的描述文本
   */
  static getMeetingTypeDescription(meetingType: TencentMeetingType): string {
    switch (meetingType) {
      case TencentMeetingType.ONE_TIME:
        return '一次性会议';
      case TencentMeetingType.RECURRING:
        return '周期性会议';
      case TencentMeetingType.WECHAT_EXCLUSIVE:
        return '微信专属会议';
      case TencentMeetingType.ROOMS_SCREEN_SHARE:
        return 'Rooms投屏会议';
      case TencentMeetingType.PERSONAL_MEETING_ID:
        return '个人会议号会议';
      default:
        return '未知会议类型';
    }
  }

  /**
   * 获取终端设备类型的描述文本
   */
  static getInstanceTypeDescription(instanceType: TencentInstanceType): string {
    switch (instanceType) {
      case TencentInstanceType.UNKNOWN:
        return '未知设备';
      case TencentInstanceType.PC:
        return 'PC端';
      case TencentInstanceType.MOBILE:
        return '移动端';
      case TencentInstanceType.WEB:
        return 'Web端';
      case TencentInstanceType.ROOMS:
        return 'Rooms设备';
      case TencentInstanceType.PHONE:
        return '电话接入';
      case TencentInstanceType.OUTDOOR:
        return '户外设备';
      default:
        return '未知设备';
    }
  }

  /**
   * 验证事件数据是否完整有效
   */
  static validateEvent(event: TencentMeetingEvent): boolean {
    if (
      !event ||
      !event.event ||
      !event.payload ||
      !Array.isArray(event.payload)
    ) {
      return false;
    }

    return event.payload.every(
      (payload) =>
        payload.operate_time &&
        payload.operator &&
        payload.meeting_info &&
        payload.meeting_info.meeting_id &&
        payload.meeting_info.meeting_code &&
        payload.meeting_info.subject &&
        payload.meeting_info.creator,
    );
  }

  /**
   * 获取事件的简短描述
   */
  static getEventDescription(event: TencentMeetingEvent): string {
    const payload = event.payload?.[0];
    if (!payload) return '未知事件';

    const meetingInfo = payload.meeting_info;
    const operator = payload.operator;

    const eventType = event.event as TencentMeetingEventType;
    switch (eventType) {
      case TencentMeetingEventType.MEETING_START:
        return `会议「${meetingInfo.subject}」开始，由 ${operator.user_name} 触发`;
      case TencentMeetingEventType.MEETING_END:
        return `会议「${meetingInfo.subject}」结束，由 ${operator.user_name} 触发`;
      case TencentMeetingEventType.MEETING_JOIN:
        return `${operator.user_name} 加入会议「${meetingInfo.subject}」`;
      case TencentMeetingEventType.MEETING_LEAVE:
        return `${operator.user_name} 离开会议「${meetingInfo.subject}」`;
      case TencentMeetingEventType.RECORDING_START:
        return `会议「${meetingInfo.subject}」开始录制`;
      case TencentMeetingEventType.RECORDING_END:
        return `会议「${meetingInfo.subject}」结束录制`;
      case TencentMeetingEventType.RECORDING_READY:
        return `会议「${meetingInfo.subject}」录制文件已就绪`;
      default:
        return `会议「${meetingInfo.subject}」${event.event}事件`;
    }
  }
}
