/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-07-28 14:01:40
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-09-03 19:50:20
 * @FilePath: /lulab_backend/src/tencent_meeting/dto/tencent-webhook.dto.ts
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