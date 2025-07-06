/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-27 18:46:28
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-27 18:54:30
 * @FilePath: /lulab_backend/src/meeting/meeting.module.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MeetingController } from './controllers/meeting.controller';
import { TencentController } from './controllers/platforms/tencent.controller';
import { MeetingService } from './meeting.service';
import { TencentMeetingApiService } from '../utils/tencent-meeting/meeting-api.service';
import { PrismaService } from '../prisma.service';
import { MeetingRepository } from './repositories/meeting.repository';

@Module({
    imports: [ConfigModule],
    controllers: [MeetingController, TencentController],
    providers: [
        MeetingService,
        TencentMeetingApiService,
        PrismaService,
        MeetingRepository
    ],
    exports: [MeetingService]
})
export class MeetingModule {}