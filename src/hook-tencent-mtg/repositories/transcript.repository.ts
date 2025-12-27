import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Platform, Prisma, PrismaClient } from '@prisma/client';
import {
  RecordingTranscriptResponse,
  RecordingTranscriptParagraph,
  RecordingTranscriptSentence,
} from '@/integrations/tencent-meeting/types';

type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

interface CreateTranscriptResult {
  transcript: {
    id: string;
  };
  paragraphsCount: number;
  duration: number;
}

interface ParagraphData {
  paragraph: RecordingTranscriptParagraph;
  speakerId?: string;
  transcriptId: string;
  index: string;
}

interface SentenceData {
  sentence: RecordingTranscriptSentence;
  paragraphId: string;
}

@Injectable()
export class TranscriptRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createTranscript(
    recordFileId: string,
    transcriptResponse: RecordingTranscriptResponse,
    participants: Array<{ uuid: string; user_name: string }>,
    meetingId?: string,
    subMeetingId?: string,
  ): Promise<CreateTranscriptResult> {
    const paragraphs = transcriptResponse.minutes?.paragraphs || [];

    if (paragraphs.length === 0) {
      throw new Error('No paragraphs in transcript response');
    }

    const startTime = Date.now();

    const { transcriptId } = await this.createCoreEntities(
      recordFileId,
      transcriptResponse,
      meetingId,
      subMeetingId,
    );

    await this.processParagraphsInBatches(
      paragraphs,
      transcriptId,
      participants,
    );

    const duration = Date.now() - startTime;

    return {
      transcript: { id: transcriptId },
      paragraphsCount: paragraphs.length,
      duration,
    };
  }

  private async createCoreEntities(
    recordFileId: string,
    transcriptResponse: RecordingTranscriptResponse,
    meetingId?: string,
    subMeetingId?: string,
  ): Promise<{ transcriptId: string; recordingId: string }> {
    return this.prisma.$transaction(async (tx) => {

      const recording = await tx.meetingRecording.findFirst({
        where: {
          externalId: recordFileId,
        },
      });

      let recordingId: string;

      if (!recording) {
        const meetingIdToUse = meetingId;

        if (!meetingIdToUse) {
          throw new Error(
            'Meeting ID is required when creating a new recording',
          );
        }

        const meeting = await tx.meeting.findFirst({
          where: {
            platform: 'TENCENT_MEETING',
            meetingId: meetingIdToUse,
            subMeetingId: subMeetingId || '__ROOT__',
          },
        });

        let finalMeetingId: string;

        if (!meeting) {
          const newMeeting = await tx.meeting.create({
            data: {
              platform: 'TENCENT_MEETING',
              meetingId: meetingIdToUse,
              subMeetingId: subMeetingId || '__ROOT__',
              title: `Auto-created meeting for transcript ${recordFileId}`,
              type: 'ONE_TIME',
              hasRecording: true,
              recordingStatus: 'COMPLETED',
              processingStatus: 'COMPLETED',
            },
          });
          finalMeetingId = newMeeting.id;
        } else {
          finalMeetingId = meeting.id;
        }

        const newRecording = await tx.meetingRecording.create({
          data: {
            externalId: recordFileId,
            source: 'PLATFORM_AUTO',
            status: 'COMPLETED',
            meetingId: finalMeetingId,
            metadata: {
              autoCreated: true,
              createdAt: new Date().toISOString(),
            },
          },
        });
        recordingId = newRecording.id;
      } else {
        recordingId = recording.id;
      }

      const transcript = await tx.transcript.create({
        data: {
          source: `tencent-meeting:${recordFileId}`,
          rawJson: transcriptResponse as unknown as Prisma.InputJsonValue,
          status: 2,
          startedAt: new Date(),
          finishedAt: new Date(),
          recordingId: recordingId,
        },
      });

      return {
        transcriptId: transcript.id,
        recordingId,
      };
    });
  }

  private async processParagraphsInBatches(
    paragraphs: RecordingTranscriptParagraph[],
    transcriptId: string,
    participants: Array<{ uuid: string; user_name: string }>,
  ): Promise<void> {
    const BATCH_SIZE = 15;

    for (let i = 0; i < paragraphs.length; i += BATCH_SIZE) {
      const batch = paragraphs.slice(i, i + BATCH_SIZE);

      await this.processParagraphBatch(batch, transcriptId, participants);
    }
  }

  private async processParagraphBatch(
    batch: RecordingTranscriptParagraph[],
    transcriptId: string,
    participants: Array<{ uuid: string; user_name: string }>,
  ): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      const paragraphDataList: Array<ParagraphData> = [];

      for (const paragraph of batch) {
        const speakerUuid = paragraph.speaker_info?.ms_open_id;
        let speakerId: string | undefined;

        if (speakerUuid) {
          const speaker = await tx.platformUser.findFirst({
            where: {
              platform: Platform.TENCENT_MEETING,
              platformUuid: speakerUuid,
            },
          });

          if (speaker) {
            speakerId = speaker.id;
          } else {
            const participant = participants.find(
              (p) => p.uuid === speakerUuid,
            );
            if (participant) {
              const newSpeaker = await tx.platformUser.create({
                data: {
                  platform: Platform.TENCENT_MEETING,
                  platformUuid: speakerUuid,
                  userName: participant.user_name,
                  isActive: true,
                },
              });
              speakerId = newSpeaker.id;
            }
          }
        }

        const createdParagraph = await tx.paragraph.create({
          data: {
            pid: paragraph.pid,
            startTimeMs: BigInt(paragraph.start_time),
            endTimeMs: BigInt(paragraph.end_time),
            speakerId,
            transcriptId,
          },
        });

        paragraphDataList.push({
          paragraph,
          speakerId,
          transcriptId,
          index: createdParagraph.id,
        });
      }

      await this.processSentencesAndWordsInBatches(paragraphDataList, tx);
    });
  }

  private async processSentencesAndWordsInBatches(
    paragraphDataList: Array<ParagraphData>,
    tx: PrismaTransaction,
  ): Promise<void> {
    const SENTENCE_BATCH_SIZE = 75;

    const allSentences: Array<SentenceData> = [];

    for (const paragraphData of paragraphDataList) {
      for (const sentence of paragraphData.paragraph.sentences) {
        allSentences.push({
          sentence,
          paragraphId: paragraphData.index,
        });
      }
    }

    for (let i = 0; i < allSentences.length; i += SENTENCE_BATCH_SIZE) {
      const batch = allSentences.slice(i, i + SENTENCE_BATCH_SIZE);

      await this.processSentenceAndWordBatch(batch, tx);
    }
  }

  private async processSentenceAndWordBatch(
    batch: Array<SentenceData>,
    tx: PrismaTransaction,
  ): Promise<void> {
    for (const sentenceData of batch) {
      const createdSentence = await tx.sentence.create({
        data: {
          sid: sentenceData.sentence.sid,
          startTimeMs: BigInt(sentenceData.sentence.start_time),
          endTimeMs: BigInt(sentenceData.sentence.end_time),
          paragraphId: sentenceData.paragraphId,
          text: sentenceData.sentence.words.map((w) => w.text).join(''),
        },
      });

      for (const [index, word] of sentenceData.sentence.words.entries()) {
        await tx.word.create({
          data: {
            wid: word.wid,
            order: index + 1,
            startTimeMs: BigInt(word.start_time),
            endTimeMs: BigInt(word.end_time),
            text: word.text,
            sentenceId: createdSentence.id,
          },
        });
      }
    }
  }
}
