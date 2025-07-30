/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-07-29 18:36:54
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-07-30 15:42:48
 * @FilePath: /lulab_backend/src/meeting/services/platforms/tencent/tencent-config.service.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 腾讯会议配置服务
 */
@Injectable()
export class TencentConfigService {
    constructor(private readonly configService: ConfigService) { }

    getToken(): string {
        return this.configService.get<string>('TENCENT_MEETING_TOKEN') || '';
    }

    getEncodingAesKey(): string {
        return this.configService.get<string>('TENCENT_MEETING_ENCODING_AES_KEY') || '';
    }

    getSecretId(): string {
        return this.configService.get<string>('TENCENT_MEETING_SECRET_ID') || '';
    }

    getSecretKey(): string {
        return this.configService.get<string>('TENCENT_MEETING_SECRET_KEY') || '';
    }

    getAppId(): string {
        return this.configService.get<string>('TENCENT_MEETING_APP_ID') || '';
    }

    getSdkId(): string {
        return this.configService.get<string>('TENCENT_MEETING_SDK_ID') || '';
    }
}