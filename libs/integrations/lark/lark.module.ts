import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LarkClient } from './lark.client';
import { BitableService } from './bitable.service';
import {
  MeetingBitableRepository,
  MeetingUserBitableRepository,
  RecordingFileBitableRepository,
} from './repositories';

@Module({
  imports: [ConfigModule],
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
