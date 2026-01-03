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
