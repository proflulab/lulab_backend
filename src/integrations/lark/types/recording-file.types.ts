export interface RecordingFileData {
  record_file_id: string;
  meet: string[];
  participants?: string[];
  start_time?: number;
  end_time?: number;
  meeting_summary?: string;
  ai_meeting_transcripts?: string;
  ai_minutes?: string;
  todo?: string;
  fullsummary?: string;
}
