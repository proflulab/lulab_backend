/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-29 01:47:59
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-29 04:12:22
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/repositories/word.repository.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PrismaTransaction } from '@/hook-tencent-mtg/types';

@Injectable()
export class WordRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tx: PrismaTransaction,
    data: {
      wid: string;
      order?: number;
      startTimeMs: bigint;
      endTimeMs: bigint;
      text: string;
      sentenceId: string;
    },
  ) {
    return tx.word.create({
      data,
    });
  }

  async createMany(
    tx: PrismaTransaction,
    words: Array<{
      wid: string;
      order?: number;
      startTimeMs: bigint;
      endTimeMs: bigint;
      text: string;
      sentenceId: string;
    }>,
  ) {
    return tx.word.createMany({
      data: words,
      skipDuplicates: true,
    });
  }
}
