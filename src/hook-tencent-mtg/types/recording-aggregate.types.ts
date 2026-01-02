import {
  MeetingParticipantDetail,
  SpeakerInfo,
} from '@/integrations/tencent-meeting/types';
import { RecordingTranscriptResponse } from '@/integrations/tencent-meeting/types';

export interface MeetingRecordingAggregate {
  participants: MeetingParticipantDetail[];
  uniqueParticipants: MeetingParticipantDetail[];
  recordings: RecordingItem[];
}

export interface RecordingItem {
  fileId: string;

  fullsummary: string;
  todo: string;
  ai_minutes: string;

  formattedTranscript: string;
  uniqueUsernames: string[];
  transcriptResponse: RecordingTranscriptResponse | null;
  keywords: string[];
  speakerInfos: SpeakerInfo[];
  matchedParticipants: MeetingParticipantDetail[];
}
