/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-11 20:21:09
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-23 01:53:59
 * @FilePath: /lulab_backend/src/hook-tencent-mtg/handlers/event-handler.factory.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved. 
 */
import { Injectable } from '@nestjs/common';
import { IEventHandler } from './base-event.handler';
import { MeetingStartedHandler } from './meeting-started.handler';
import { MeetingEndedHandler } from './meeting-ended.handler';
import { RecordingCompletedHandler } from './recording-completed.handler';
import { MeetingParticipantJoinedHandler } from './meeting-participant-joined.handler';

/**
 * 事件处理器工厂
 */
@Injectable()
export class EventHandlerFactory {
  constructor(
    private readonly meetingStartedHandler: MeetingStartedHandler,
    private readonly meetingEndedHandler: MeetingEndedHandler,
    private readonly recordingCompletedHandler: RecordingCompletedHandler,
    private readonly meetingParticipantJoinedHandler: MeetingParticipantJoinedHandler,
  ) {}

  /**
   * 获取事件处理器
   */
  getHandler(event: string): IEventHandler | null {
    const handlers: IEventHandler[] = [
      this.meetingStartedHandler,
      this.meetingEndedHandler,
      this.recordingCompletedHandler,
      this.meetingParticipantJoinedHandler,
    ];

    return handlers.find((handler) => handler.supports(event)) || null;
  }

  /**
   * 获取支持的事件类型列表
   */
  getSupportedEvents(): string[] {
    return [
      'meeting.started',
      'meeting.end',
      'recording.completed',
      'meeting.participant-joined',
    ];
  }
}
