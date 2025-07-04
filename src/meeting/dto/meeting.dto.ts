import { MeetingPlatform } from '../../../generated/prisma';

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