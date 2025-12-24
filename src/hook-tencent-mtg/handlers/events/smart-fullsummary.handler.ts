/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-25 05:15:00
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-25 06:09:44
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/handlers/events/smart-fullsummary.handler.ts
 * @Description: 智能摘要完成事件处理器
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { Injectable } from '@nestjs/common';
import { BaseEventHandler } from '../base/base-event.handler';
import { TencentEventPayload } from '../../types';
// import { MeetingBitableService } from '../../services/meeting-bitable.service';
// import { MeetingDatabaseService } from '../../services/meeting-database.service';

/**
 * 智能摘要完成事件处理器
 */

@Injectable()
export class SmartFullsummaryHandler extends BaseEventHandler {
  private readonly SUPPORTED_EVENT = 'smart.fullsummary';

  constructor() {
    // private readonly meetingDatabaseService: MeetingDatabaseService, // private readonly meetingBitableService: MeetingBitableService,
    super();
  }

  supports(event: string): boolean {
    return event === this.SUPPORTED_EVENT;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async handle(payload: TencentEventPayload, index: number): Promise<void> {
    // const { meeting_info, operator } = payload;

    this.logEventProcessing(this.SUPPORTED_EVENT, payload, index);

    // // 使用 Promise.allSettled 并行执行所有操作，确保任何一个失败都不会影响其他操作
    // await Promise.allSettled([
    //   // 处理用户记录（操作者和创建者）- 飞书多维表格
    //   this.meetingBitableService.upsertMeetingUserRecord(operator),
    //   // 如果操作者和创建者不是同一人，也处理创建者记录
    //   ...(operator.uuid !== meeting_info.creator.uuid
    //     ? [
    //         this.meetingBitableService.upsertMeetingUserRecord(
    //           meeting_info.creator,
    //         ),
    //       ]
    //     : []),

    //   // 更新会议记录 - 飞书多维表格
    //   this.meetingBitableService.updateMeetingParticipants(
    //     meeting_info,
    //     operator,
    //   ),

    //   // 更新会议记录的智能摘要状态 - Prisma数据库
    //   this.meetingDatabaseService.upsertMeetingRecord(payload),
    // ]);

    return;
  }
}
