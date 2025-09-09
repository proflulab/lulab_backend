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
export enum TencentMeetingEndType {
    ACTIVE_END = 0, // 主动结束会议
    LAST_USER_LEAVE_AFTER_END = 1, // 最后一个参会用户离开会议且超过了预定会议结束时间
    NO_USER_AFTER_END = 2, // 会议中无人且超过了预定会议结束时间
    NO_USER_BEFORE_END = 3, // 会议中无人且未到会议预定结束时间
}

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
        return meetingInfo.meeting_id_type === TencentMeetingIdType.BREAKOUT || 
               !!meetingInfo.sub_meeting_id;
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
    static getCreateFromDescription(createFrom: TencentMeetingCreateFrom): string {
        const descriptions = {
            [TencentMeetingCreateFrom.EMPTY]: '空来源',
            [TencentMeetingCreateFrom.CLIENT]: '客户端',
            [TencentMeetingCreateFrom.WEB]: 'Web端',
            [TencentMeetingCreateFrom.WECHAT_WORK]: '企业微信',
            [TencentMeetingCreateFrom.WECHAT]: '微信',
            [TencentMeetingCreateFrom.OUTLOOK]: 'Outlook',
            [TencentMeetingCreateFrom.REST_API]: 'REST API',
            [TencentMeetingCreateFrom.TENCENT_DOCS]: '腾讯文档',
            [TencentMeetingCreateFrom.ROOMS_SMART_RECORDING]: 'Rooms智能录制',
        };
        return descriptions[createFrom] || '未知来源';
    }

    /**
     * 获取终端设备类型的描述文本
     */
    static getInstanceTypeDescription(instanceType: TencentInstanceType): string {
        const descriptions = {
            [TencentInstanceType.UNKNOWN]: '未知设备',
            [TencentInstanceType.PC]: 'PC端',
            [TencentInstanceType.MOBILE]: '移动端',
            [TencentInstanceType.WEB]: 'Web端',
            [TencentInstanceType.ROOMS]: 'Rooms设备',
            [TencentInstanceType.PHONE]: '电话接入',
            [TencentInstanceType.OUTDOOR]: '户外设备',
        };
        return descriptions[instanceType] || '未知设备';
    }

    /**
     * 验证事件数据是否完整有效
     */
    static validateEvent(event: TencentMeetingEvent): boolean {
        if (!event || !event.event || !event.payload || !Array.isArray(event.payload)) {
            return false;
        }

        return event.payload.every(payload => 
            payload.operate_time && 
            payload.operator && 
            payload.meeting_info &&
            payload.meeting_info.meeting_id &&
            payload.meeting_info.meeting_code &&
            payload.meeting_info.subject &&
            payload.meeting_info.creator
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

        switch (event.event) {
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