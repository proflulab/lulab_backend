/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-10-01 06:08:33
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-10-01 06:27:17
 * @FilePath: /lulab_backend/src/configs/tencent-mtg.config.ts
 * @Description:
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */
import { registerAs, ConfigType } from '@nestjs/config';

export const tencentMeetingConfig = registerAs('tencentMeeting', () => ({
  webhook: {
    token: process.env.TENCENT_MEETING_TOKEN ?? '',
    encodingAesKey: process.env.TENCENT_MEETING_ENCODING_AES_KEY ?? '',
  },
  api: {
    secretId: process.env.TENCENT_MEETING_SECRET_ID ?? '',
    secretKey: process.env.TENCENT_MEETING_SECRET_KEY ?? '',
    appId: process.env.TENCENT_MEETING_APP_ID ?? '',
    sdkId: process.env.TENCENT_MEETING_SDK_ID ?? '',
    userId: process.env.USER_ID ?? '',
  },
}));

export type TencentMeetingConfig = ConfigType<typeof tencentMeetingConfig>;
