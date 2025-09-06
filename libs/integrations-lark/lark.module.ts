import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LarkClient } from './lark.client';
import { BitableService } from './bitable.service';
import { MeetingBitableRepository, MeetingUserBitableRepository } from './repositories';

@Module({
    imports: [ConfigModule],
    providers: [
        LarkClient,
        BitableService,
        MeetingBitableRepository,
        MeetingUserBitableRepository,
    ],
    exports: [
        LarkClient,
        BitableService,
        MeetingBitableRepository,
        MeetingUserBitableRepository,
    ],
})
export class LarkModule { }