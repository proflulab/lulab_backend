/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-17 21:43:23
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-17 21:43:31
 * @FilePath: /lulab_backend/src/meeting/types/platform-integration.types.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */
import { MeetingPlatform } from '@prisma/client';

/**
 * 平台事件数据接口
 */
export interface PlatformEventData {
  event: string;
  platform: MeetingPlatform;
  payload: any;
}

/**
 * Webhook验证参数
 */
export interface WebhookVerificationParams {
  timestamp: string;
  nonce: string;
  signature: string;
  data: string;
}

/**
 * URL验证参数
 */
export interface UrlVerificationParams {
  checkStr: string;
  timestamp: string;
  nonce: string;
  signature: string;
}
