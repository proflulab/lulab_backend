// 腾讯会议相关类型定义
// 注意：事件相关类型已移动到 tencent-events.types.ts 文件中
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