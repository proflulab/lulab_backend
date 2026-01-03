import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PrismaTransaction } from '@/hook-tencent-mtg/types';
import { Prisma } from '@prisma/client';

@Injectable()
export class TranscriptRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tx: PrismaTransaction,
    data: {
      source: string;
      rawJson: Prisma.InputJsonValue;
      status: number;
      startedAt?: Date;
      finishedAt?: Date;
      recordingId: string;
    },
  ) {
    return tx.transcript.create({
      data,
    });
  }

  async findById(id: string) {
    return this.prisma.transcript.findUnique({
      where: { id },
      include: {
        paragraphs: {
          include: {
            sentences: {
              include: {
                words: true,
              },
            },
          },
        },
      },
    });
  }

  async findByRecordingId(recordingId: string) {
    return this.prisma.transcript.findFirst({
      where: { recordingId },
    });
  }

  async findBySource(source: string) {
    return this.prisma.transcript.findFirst({
      where: { source },
    });
  }
}
