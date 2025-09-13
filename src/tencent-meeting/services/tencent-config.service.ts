import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebhookConfigException } from '@libs/integrations/tencent-meeting';

@Injectable()
export class TencentMeetingConfigService {
  constructor(private readonly configService: ConfigService) {}

  getWebhookConfig(): { token: string; encodingAesKey: string } {
    const token = this.configService.get<string>('TENCENT_MEETING_TOKEN');
    if (!token) {
      throw new WebhookConfigException('TENCENT_MEETING', 'TENCENT_MEETING_TOKEN');
    }

    const encodingAesKey = this.configService.get<string>(
      'TENCENT_MEETING_ENCODING_AES_KEY',
    );
    if (!encodingAesKey) {
      throw new WebhookConfigException(
        'TENCENT_MEETING',
        'TENCENT_MEETING_ENCODING_AES_KEY',
      );
    }

    return { token, encodingAesKey };
  }
}
