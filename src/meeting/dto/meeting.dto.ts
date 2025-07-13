/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-07-06 05:57:48
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-07-07 03:11:31
 * @FilePath: /lulab_backend/src/meeting/dto/meeting.dto.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { MeetingPlatform } from '@prisma/client';

export class GetMeetingRecordsDto {
    platform?: MeetingPlatform;
    startDate?: string;
    endDate?: string;
    page?: number = 1;
    limit?: number = 20;
}

export class TencentWebhookVerifyDto {
    check_str: string;
    timestamp: string;
    nonce: string;
    signature: string;
}

export class TencentWebhookEventDto {
    data: string;
    timestamp: string;
    nonce: string;
    signature: string;
}