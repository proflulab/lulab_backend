import { Injectable, Logger } from '@nestjs/common';
import {
  RecordingTranscriptResponse,
  SpeakerInfo,
  MeetingParticipantDetail,
} from '@/integrations/tencent-meeting/types';
import { RecordingContentService } from './recording-content.service';
import { TranscriptService } from './transcript.service';
import { SpeakerService } from './speaker.service';
import { MeetingParticipantService } from './meeting-participant.service';
import {
  MeetingRecordingAggregate,
  RecordingItem,
  RecordingFile,
} from '../types';

@Injectable()
export class RecordingProcessorService {
  private readonly logger = new Logger(RecordingProcessorService.name);

  constructor(
    private readonly recordingContentService: RecordingContentService,
    private readonly transcriptService: TranscriptService,
    private readonly speakerService: SpeakerService,
    private readonly participantService: MeetingParticipantService,
  ) {}

  async processRecordings(
    meetingId: string,
    creatorUserId: string,
    recordingFiles: RecordingFile[],
    subMeetingId?: string,
  ): Promise<MeetingRecordingAggregate> {
    const recordingAggregate: MeetingRecordingAggregate = {
      participants: [] as MeetingParticipantDetail[],
      uniqueParticipants: [] as MeetingParticipantDetail[],
      recordings: [] as RecordingItem[],
    };

    const { participants, uniqueParticipants } =
      await this.participantService.getUniqueParticipants(
        meetingId,
        creatorUserId,
        subMeetingId,
      );

    recordingAggregate.uniqueParticipants = uniqueParticipants;
    recordingAggregate.participants = participants;

    for (const file of recordingFiles) {
      const fileId = file.record_file_id;

      const recordingItem = await this.processRecordingItem(
        fileId,
        creatorUserId,
        uniqueParticipants,
      );

      recordingAggregate.recordings.push(recordingItem);
    }

    return recordingAggregate;
  }

  private async processRecordingItem(
    fileId: string,
    creatorUserId: string,
    uniqueParticipants: MeetingParticipantDetail[],
  ): Promise<RecordingItem> {
    let fullsummary: string = '';
    let todo: string = '';
    let ai_minutes: string = '';
    let formattedTranscript: string = '';
    let uniqueUsernames: string[] = [];
    let transcriptResponse: RecordingTranscriptResponse | null = null;
    let keywords: string[] = [];
    let speakerInfos: SpeakerInfo[] = [];

    const [meetingContentResult, transcriptResult] = await Promise.allSettled([
      this.recordingContentService.getMeetingContent(fileId, creatorUserId),
      this.transcriptService.getTranscript(fileId, creatorUserId),
    ]);

    if (meetingContentResult.status === 'fulfilled') {
      ({ fullsummary, todo, ai_minutes } = meetingContentResult.value);
    } else {
      this.logger.warn(`获取会议内容失败: ${fileId}`);
    }

    if (transcriptResult.status === 'fulfilled') {
      formattedTranscript = transcriptResult.value.formattedTranscript;
      uniqueUsernames = transcriptResult.value.uniqueUsernames;
      transcriptResponse = transcriptResult.value.transcriptResponse || null;
      keywords = transcriptResult.value.keywords || [];
      speakerInfos = transcriptResult.value.speakerInfos || [];
    } else {
      this.logger.warn(`获取录音转写失败: ${fileId}`);
    }

    const matchedParticipants =
      this.speakerService.matchParticipantsWithSpeakers(
        speakerInfos,
        uniqueParticipants,
      );

    return {
      fileId,
      fullsummary,
      todo,
      ai_minutes,
      formattedTranscript,
      uniqueUsernames,
      transcriptResponse,
      keywords,
      speakerInfos,
      matchedParticipants,
    };
  }
}
