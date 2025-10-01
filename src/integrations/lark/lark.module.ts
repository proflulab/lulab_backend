import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LarkClient } from './lark.client';
import { BitableService, MeetingRecordingService } from './services';
import {
  MeetingBitableRepository,
  MeetingUserBitableRepository,
  RecordingFileBitableRepository,
} from './repositories';
import { larkConfig } from './config/lark.config';

@Module({
  imports: [ConfigModule.forFeature(larkConfig)],
  providers: [
    LarkClient,
    BitableService,
    MeetingRecordingService,
    MeetingBitableRepository,
    MeetingUserBitableRepository,
    RecordingFileBitableRepository,
  ],
  exports: [
    LarkClient,
    BitableService,
    MeetingRecordingService,
    MeetingBitableRepository,
    MeetingUserBitableRepository,
    RecordingFileBitableRepository,
  ],
})
export class LarkModule {}
