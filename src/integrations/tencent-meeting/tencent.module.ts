/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-10-01 01:08:34
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-10-01 14:00:59
 * @FilePath: /lulab_backend/src/integrations/tencent-meeting/tencent.module.ts
 * @Description: 腾讯会议模块
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TencentApiService } from './api.service';
import { tencentMeetingConfig } from '@/configs/tencent-mtg.config';

@Module({
  imports: [ConfigModule.forFeature(tencentMeetingConfig)],
  providers: [TencentApiService],
  exports: [TencentApiService],
})
export class TencentModule {}
