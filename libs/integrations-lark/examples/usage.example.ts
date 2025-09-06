/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-09-05 03:17:16
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-09-05 22:24:04
 * @FilePath: /lulab_backend/libs/integrations-lark/examples/usage.example.ts
 * @Description: Lark Bitable integration example
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeetingBitableRepository } from '../repositories';

/**
 * Example usage of Lark Bitable integration
 * This file demonstrates how to use the Lark services in your application
 */
@Injectable()
export class LarkUsageExample {
    private readonly logger = new Logger(LarkUsageExample.name);

    constructor(
        private readonly bitableRepository: MeetingBitableRepository,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Example 1: Create a simple record
     */
    async createSimpleRecord() {
        try {
            const result = await this.bitableRepository.createMeetingRecord({
                platform: "lark",
                subject: "Meeting with Team",
                meeting_id: "123456789",
                sub_meeting_id: "987654321",
                meeting_code: "CODE123",
                start_time: Date.now(),
                end_time: Date.now(),
                operator: ["user1", "user2"],
                creator: ["user3"]
            });

            this.logger.log('Simple record created:', result.data?.record?.record_id);
            return result;
        } catch (error) {
            this.logger.error('Failed to create simple record:', error);
            throw error;
        }
    }

}