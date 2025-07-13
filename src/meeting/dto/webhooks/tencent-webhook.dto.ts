import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 腾讯会议Webhook验证DTO
 */
export class TencentWebhookVerificationDto {
    @ApiProperty({ description: '验证字符串', required: true })
    @IsString()
    @IsNotEmpty()
    check_str: string;

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
 * 腾讯会议Webhook事件DTO
 */
export class TencentWebhookEventDto {
    @ApiProperty({ description: '加密的事件数据', required: true })
    @IsString()
    @IsNotEmpty()
    data: string;
}

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