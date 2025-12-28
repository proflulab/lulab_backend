import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PrismaTransaction } from '@/hook-tencent-mtg/types';
import { RecordingTranscriptParagraph } from '@/integrations/tencent-meeting/types';
import { ParagraphData, SentenceData } from '@/hook-tencent-mtg/types';
import { ParagraphRepository } from '@/hook-tencent-mtg/repositories/paragraph.repository';
import { SentenceRepository } from '@/hook-tencent-mtg/repositories/sentence.repository';
import { WordRepository } from '@/hook-tencent-mtg/repositories/word.repository';
import { SpeakerService } from '@/hook-tencent-mtg/services/speaker.service';
import { MeetingParticipantDetail } from '@/integrations/tencent-meeting/types';

@Injectable()
export class TranscriptBatchProcessor {
  private readonly PARAGRAPH_BATCH_SIZE = 15;
  private readonly SENTENCE_BATCH_SIZE = 75;

  constructor(
    private readonly prisma: PrismaService,
    private readonly paragraphRepository: ParagraphRepository,
    private readonly sentenceRepository: SentenceRepository,
    private readonly wordRepository: WordRepository,
    private readonly speakerService: SpeakerService,
  ) {}

  async processParagraphsInBatches(
    paragraphs: RecordingTranscriptParagraph[],
    transcriptId: string,
    participants: MeetingParticipantDetail[],
  ): Promise<void> {
    for (let i = 0; i < paragraphs.length; i += this.PARAGRAPH_BATCH_SIZE) {
      const batch = paragraphs.slice(i, i + this.PARAGRAPH_BATCH_SIZE);
      await this.processParagraphBatch(batch, transcriptId, participants);
    }
  }

  private async processParagraphBatch(
    batch: RecordingTranscriptParagraph[],
    transcriptId: string,
    participants: MeetingParticipantDetail[],
  ): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      const paragraphDataList: Array<ParagraphData> = [];

      for (const paragraph of batch) {
        const speakerId = await this.speakerService.findOrCreateSpeaker(
          tx,
          paragraph.speaker_info,
          participants,
        );

        const createdParagraph = await this.paragraphRepository.create(tx, {
          pid: paragraph.pid,
          startTimeMs: BigInt(paragraph.start_time),
          endTimeMs: BigInt(paragraph.end_time),
          speakerId,
          transcriptId,
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
    const allSentences: Array<SentenceData> = [];

    for (const paragraphData of paragraphDataList) {
      for (const sentence of paragraphData.paragraph.sentences) {
        allSentences.push({
          sentence,
          paragraphId: paragraphData.index,
        });
      }
    }

    for (let i = 0; i < allSentences.length; i += this.SENTENCE_BATCH_SIZE) {
      const batch = allSentences.slice(i, i + this.SENTENCE_BATCH_SIZE);
      await this.processSentenceAndWordBatch(batch, tx);
    }
  }

  private async processSentenceAndWordBatch(
    batch: Array<SentenceData>,
    tx: PrismaTransaction,
  ): Promise<void> {
    for (const sentenceData of batch) {
      const createdSentence = await this.sentenceRepository.create(tx, {
        sid: sentenceData.sentence.sid,
        startTimeMs: BigInt(sentenceData.sentence.start_time),
        endTimeMs: BigInt(sentenceData.sentence.end_time),
        paragraphId: sentenceData.paragraphId,
        text: sentenceData.sentence.words.map((w) => w.text).join(''),
      });

      const words = sentenceData.sentence.words.map((word) => ({
        wid: word.wid,
        startTimeMs: BigInt(word.start_time),
        endTimeMs: BigInt(word.end_time),
        text: word.text,
        sentenceId: createdSentence.id,
      }));

      await this.wordRepository.createMany(tx, words);
    }
  }
}
