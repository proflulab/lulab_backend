// 腾讯会议相关类型定义
export interface TencentMeetingConfig {
    secretId: string;
    secretKey: string;
    appId: string;
    sdkId: string;
    token: string;
    encodingAesKey: string;
}

export interface TencentWebhookEvent {
    event: string;
    payload: any;
}

export interface TencentRecordingFile {
    record_file_id: string;
    // 其他字段根据实际API响应添加
}

export interface MeetingSummary {
    download_address: string;
    file_type: string;
}

export interface RecordingDetail {
    meeting_id: string;
    meeting_code: string;
    record_file_id: string;
    view_address?: string;
    download_address?: string;
    download_address_file_type?: string;
    audio_address?: string;
    audio_address_file_type?: string;
    meeting_summary?: MeetingSummary[];
    // AI会议转写记录
    ai_meeting_transcripts?: MeetingSummary[];
    // AI会议纪要
    ai_minutes?: MeetingSummary[];
    // 录制文件名称
    record_name?: string;
    // 录制开始时间戳
    start_time?: string;
    // 录制结束时间戳
    end_time?: string;
    // 会议名称
    meeting_record_name?: string;
}

export interface RecordFile {
    record_file_id: string;
    record_start_time: number;
    record_end_time: number;
    record_size: number;
    sharing_state: number;
    sharing_url?: string;
    required_same_corp?: boolean;
    required_participant?: boolean;
    password?: string;
    sharing_expire?: number;
    view_address?: string;
    allow_download?: boolean;
    download_address?: string;
}

export interface RecordMeeting {
    meeting_record_id: string;
    meeting_id: string;
    meeting_code: string;
    userid: string;
    media_start_time: number;
    subject: string;
    state: number;
    record_files?: RecordFile[];
}

export interface RecordMeetingsResponse {
    total_count: number;
    current_size: number;
    current_page: number;
    total_page: number;
    record_meetings?: RecordMeeting[];
    error_info?: {
        error_code: number;
        new_error_code?: number;
        message: string;
    };
}

export interface MeetingParticipantDetail {
    userid: string;
    uuid: string;
    user_name: string;
    phone: string;
    join_time: string;
    left_time: string;
    instanceid: number;
    user_role: number;
    ip: string;
    location: string;
    link_type: string;
    join_type: number;
    net: string;
    app_version: string;
    audio_state: boolean;
    video_state: boolean;
    screen_shared_state: boolean;
    webinar_member_role: number;
    ms_open_id: string;
    open_id: string;
    customer_data: string;
    is_enterprise_user: boolean;
    tm_corpid: string;
    avatar_url: string;
}

export interface MeetingParticipantsResponse {
    meeting_id: string;
    meeting_code: string;
    subject: string;
    schedule_start_time: string;
    schedule_end_time: string;
    participants: MeetingParticipantDetail[];
    has_remaining: boolean;
    next_pos: number;
    total_count: number;
    error_info?: {
        error_code: number;
        new_error_code?: number;
        message: string;
    };
}

export interface MeetingDetailResponse {
    meeting_id: string;
    meeting_code: string;
    subject: string;
    description?: string;
    start_time: string;
    end_time: string;
    creator: {
        userid: string;
        user_name: string;
    };
    meeting_type: number;
    sub_meeting_id?: string;
    error_info?: {
        error_code: number;
        new_error_code?: number;
        message: string;
    };
}

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

// 腾讯会议信息
export interface TencentEventMeetingInfo {
    meeting_id: string; // 会议 ID
    meeting_code: string; // 会议 code
    subject: string; // 会议主题
    creator: TencentMeetingCreator;
    hosts?: TencentMeetingHost[]; // 主持人（某些事件类型包含）
    meeting_type: number; // 会议类型(0:一次性会议，1:周期性会议，2:微信专属会议，4:rooms 投屏会议，5:个人会议号会议)
    start_time: number; // 秒级别的会议开始时间戳
    end_time: number; // 秒级别的会议结束时间戳
    meeting_create_mode?: number; // 会议创建类型 0:普通会议；1:快速会议
    meeting_create_from?: number; // 会议创建来源 0:空来源，1:客户端，2:web，3:企微，4:微信，5:outlook，6:restapi，7:腾讯文档，8:Rooms 智能录制
    meeting_id_type?: number; // 会议 ID 类型 0:主会议 ID；1:分组会议 ID
    sub_meeting_id?: string;
}

// 腾讯会议事件载荷
export interface TencentEventPayload {
    operate_time: number; // 毫秒级别事件操作时间戳
    operator: TencentEventOperator; // 事件操作者
    meeting_info: TencentEventMeetingInfo; // 会议信息
    meeting_end_type?: number; // 结束类型（仅 meeting.end 事件）（0:主动结束会议，1:最后一个参会用户离开会议且超过了预定会议结束时间，2:会议中无人且超过了预定会议结束时间，3:会议中无人且未到会议预定结束时间）
    recording_files?: Array<{
        record_file_id: string;
    }>; // 录制文件（某些事件类型包含）
}

// 腾讯会议事件
export interface TencentMeetingEvent {
    event: string; // 事件名
    trace_id: string; // 事件的唯一序列值
    payload: TencentEventPayload[];
}