/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-07-28 14:01:40
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-07-29 16:21:37
 * @FilePath: /lulab_backend/src/meeting/dto/webhooks/tencent-webhook.dto.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 腾讯会议Webhook头部DTO
 */
export class TencentWebhookHeadersDto {
    @ApiProperty({ description: '时间戳', required: true })
    @IsString()
    @IsNotEmpty()
    timestamp: string;

    @ApiProperty({ description: '随机数', required: true })
    @IsString()
    @IsNotEmpty()
    nonce: string;

    @ApiProperty({ description: '签名', required: true })
    @IsString()
    @IsNotEmpty()
    signature: string;
}

/**
 * 腾讯会议事件数据结构
 */
export interface TencentMeetingEventPayload {
    meeting_info: {
        meeting_id: number;
        meeting_code: string;
        meeting_type: number;
        sub_meeting_id?: string;
        creator: {
            userid: string;
            user_name: string;
        };
        start_time: number;
        end_time: number;
        subject: string;
    };
    recording_files: Array<{
        record_file_id: string;
    }>;
}

/**
 * 腾讯会议事件响应
 */
export interface TencentMeetingEventResponse {
    event: string;
    payload: TencentMeetingEventPayload[];
}