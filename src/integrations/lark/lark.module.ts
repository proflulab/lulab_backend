import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LarkClient } from './lark.client';
import { BitableService } from './services/bitable.service';
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
    MeetingBitableRepository,
    MeetingUserBitableRepository,
    RecordingFileBitableRepository,
  ],
  exports: [
    LarkClient,
    BitableService,
    MeetingBitableRepository,
    MeetingUserBitableRepository,
    RecordingFileBitableRepository,
  ],
})
export class LarkModule {}
