/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-10-02 21:14:03
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-10-05 00:40:03
 * @FilePath: /lulab_backend/src/integrations/lark/lark.module.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LarkClient } from './lark.client';
import { BitableService, MeetingRecordingService } from './services';
import {
  MeetingBitableRepository,
  MeetingUserBitableRepository,
  RecordingFileBitableRepository,
  NumberRecordBitableRepository,
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
    NumberRecordBitableRepository,
    MeetingRecordingService,
  ],
  exports: [
    LarkClient,
    BitableService,
    MeetingRecordingService,
    MeetingBitableRepository,
    MeetingUserBitableRepository,
    RecordingFileBitableRepository,
    NumberRecordBitableRepository,
    MeetingRecordingService,
  ],
})
export class LarkModule {}
