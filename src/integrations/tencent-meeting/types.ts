export interface TencentRecordingFile {
  record_file_id: string;
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
  ai_meeting_transcripts?: MeetingSummary[];
  ai_minutes?: MeetingSummary[];
  record_name?: string;
  start_time?: string;
  end_time?: string;
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

export interface User {
  userid: string;
  user_name: string;
}

export interface Setting {
  allow_in_before_host?: boolean;
  allow_screen_shared?: boolean;
  allow_unmute_self?: boolean;
  allow_unmute_by_host?: boolean;
  auto_record?: boolean;
  participant_join_mute?: number;
  enable_host_pause_all_video?: boolean;
  enable_pause_all_video?: boolean;
  enable_enter_mute?: boolean;
  enable_waiting_room?: boolean;
}

export interface RecurringRule {
  recurring_type: number;
  until_type: number;
  until_count?: number;
  until_date?: string;
  day_intervals?: string;
  week_days?: string;
  month_day?: number;
}

export interface SubMeeting {
  sub_meeting_id: string;
  status: string;
  start_time: string;
  end_time: string;
}

export interface LiveConfig {
  enable_live: boolean;
  live_subject?: string;
  live_summary?: string;
  enable_live_password: boolean;
  live_password?: string;
  enable_live_im: boolean;
  enable_live_share: boolean;
  enable_live_replay: boolean;
  allow_participant_start_live: boolean;
}

export interface MeetingDetailResponse {
  meeting_number?: number;
  meeting_info_list?: Array<{
    subject: string;
    meeting_id: string;
    meeting_code: string;
    password?: string;
    need_password?: boolean;
    status: string;
    type: number;
    join_url?: string;
    hosts?: User[];
    current_hosts?: User[];
    current_co_hosts?: User[];
    participants?: User[];
    start_time: string;
    end_time: string;
    settings?: Setting;
    meeting_type: number;
    recurring_rule?: RecurringRule;
    sub_meetings?: SubMeeting[];
    has_more_sub_meeting?: number;
    remain_sub_meetings?: number;
    current_sub_meeting_id?: string;
    enable_live?: boolean;
    live_config?: LiveConfig;
    enable_doc_upload_permission?: boolean;
    guest_modify_permission?: boolean;
    allow_anonymous_user?: boolean;
    allow_anonymous_start_meeting?: boolean;
  }>;
  meeting_id?: string;
  meeting_code?: string;
  subject?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  creator?: User;
  meeting_type?: number;
  sub_meeting_id?: string;
  password?: string;
  need_password?: boolean;
  status?: string;
  type?: number;
  join_url?: string;
  hosts?: User[];
  current_hosts?: User[];
  current_co_hosts?: User[];
  participants?: User[];
  settings?: Setting;
  recurring_rule?: RecurringRule;
  sub_meetings?: SubMeeting[];
  has_more_sub_meeting?: number;
  remain_sub_meetings?: number;
  current_sub_meeting_id?: string;
  enable_live?: boolean;
  live_config?: LiveConfig;
  enable_doc_upload_permission?: boolean;
  guest_modify_permission?: boolean;
  allow_anonymous_user?: boolean;
  allow_anonymous_start_meeting?: boolean;
  error_info?: {
    error_code: number;
    new_error_code?: number;
    message: string;
  };
}

export interface MeetingMinute {
  minute: string;
  todo: string;
}

export interface TopicTime {
  pid: string;
  start_time: string;
  end_time: string;
}

export interface AiTopic {
  topic_id: string;
  topic_name: string;
  topic_time: TopicTime[];
}

export interface SmartTopicsResponse {
  ai_topic_list: AiTopic[];
  error_info?: {
    error_code: number;
    new_error_code?: number;
    message: string;
  };
}

export interface SmartFullSummaryResponse {
  ai_summary: string;
  error_info?: {
    error_code: number;
    new_error_code?: number;
    message: string;
  };
}

export interface SmartMeetingMinutes {
  minute: string;
  todo: string;
}

export interface SmartMeetingMinutesResponse {
  meeting_minute: SmartMeetingMinutes;
  error_info?: {
    error_code: number;
    new_error_code?: number;
    message: string;
  };
}

export interface RecordingTranscriptWord {
  wid: string;
  start_time: number;
  end_time: number;
  text: string;
}

export interface RecordingTranscriptSentence {
  sid: string;
  start_time: number;
  end_time: number;
  words: RecordingTranscriptWord[];
}

export interface SpeakerInfo {
  userid: string;
  openId: string;
  username: string;
  ms_open_id: string;
}

export interface RecordingTranscriptParagraph {
  pid: string;
  start_time: number;
  end_time: number;
  sentences: RecordingTranscriptSentence[];
  speaker_info: SpeakerInfo;
}

export interface RecordingTranscriptData {
  paragraphs: RecordingTranscriptParagraph[];
}

export interface RecordingTranscriptResponse {
  minutes: RecordingTranscriptData;
  more: boolean;
  error_info?: {
    error_code: number;
    new_error_code?: number;
    message: string;
  };
}
