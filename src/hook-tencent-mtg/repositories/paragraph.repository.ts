import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PrismaTransaction } from '@/hook-tencent-mtg/types';

@Injectable()
export class ParagraphRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tx: PrismaTransaction,
    data: {
      pid: string;
      startTimeMs: bigint;
      endTimeMs: bigint;
      speakerId?: string;
      transcriptId: string;
    },
  ) {
    return tx.paragraph.create({
      data,
    });
  }

  async createMany(
    tx: PrismaTransaction,
    paragraphs: Array<{
      pid: string;
      startTimeMs: bigint;
      endTimeMs: bigint;
      speakerId?: string;
      transcriptId: string;
    }>,
  ) {
    return tx.paragraph.createMany({
      data: paragraphs,
      skipDuplicates: true,
    });
  }
}
