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

export interface TranscriptWord {
  wid: string;
  start_time: number;
  end_time: number;
  text: string;
}

export interface TranscriptSentence {
  sid: string;
  start_time: number;
  end_time: number;
  words: TranscriptWord[];
}

export interface TranscriptParagraph {
  pid: string;
  start_time: number;
  end_time: number;
  sentences: TranscriptSentence[];
}

export interface TranscriptMinutes {
  paragraphs: TranscriptParagraph[];
}

export interface RecordingTranscriptDetail {
  minutes: TranscriptMinutes;
  more: boolean;
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

export interface SmartMinutesResponse {
  meeting_minute: MeetingMinute;
  error_info?: {
    error_code: number;
    new_error_code?: number;
    message: string;
  };
}

export interface SmartSummaryResponse {
  ai_summary: string;
  error_info?: {
    error_code: number;
    new_error_code?: number;
    message: string;
  };
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
