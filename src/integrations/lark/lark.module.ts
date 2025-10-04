/*
 * @Author: Luckymingxuan <songmingxuan936@gmail.com>
 * @Date: 2025-10-01 21:24:41
 * @LastEditors: Luckymingxuan <songmingxuan936@gmail.com>
 * @LastEditTime: 2025-10-03 11:56:38
 * @FilePath: \lulab_backend\src\integrations\lark\lark.module.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LarkClient } from './lark.client';
import { BitableService, MeetingRecordingService } from './services';
import {
  MeetingBitableRepository,
  MeetingUserBitableRepository,
  RecordingFileBitableRepository,
} from './repositories';
import { larkConfig } from '../../configs/lark.config';

@Module({
  imports: [ConfigModule.forFeature(larkConfig)],
  providers: [
    LarkClient,
    BitableService,
    MeetingRecordingService,
    MeetingBitableRepository,
    MeetingUserBitableRepository,
    RecordingFileBitableRepository,
    MeetingRecordingService,
  ],
  exports: [
    LarkClient,
    BitableService,
    MeetingRecordingService,
    MeetingBitableRepository,
    MeetingUserBitableRepository,
    RecordingFileBitableRepository,
    MeetingRecordingService,
  ],
})
export class LarkModule {}
