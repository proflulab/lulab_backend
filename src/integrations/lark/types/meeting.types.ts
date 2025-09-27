export interface MeetingData {
  platform: string;
  subject?: string;
  meeting_id: string;
  sub_meeting_id?: string;
  meeting_code?: string;
  start_time?: number;
  end_time?: number;
  operator?: string[];
  creator?: string[];
  participants?: string[];
}
