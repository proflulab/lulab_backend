import { Injectable } from '@nestjs/common';
import { IEventHandler } from './base-event.handler';
import { MeetingStartedHandler } from './meeting-started.handler';
import { MeetingEndedHandler } from './meeting-ended.handler';
import { RecordingCompletedHandler } from './recording-completed.handler';

/**
 * 事件处理器工厂
 */
@Injectable()
export class EventHandlerFactory {
  constructor(
    private readonly meetingStartedHandler: MeetingStartedHandler,
    private readonly meetingEndedHandler: MeetingEndedHandler,
    private readonly recordingCompletedHandler: RecordingCompletedHandler,
  ) {}

  /**
   * 获取事件处理器
   */
  getHandler(event: string): IEventHandler | null {
    const handlers: IEventHandler[] = [
      this.meetingStartedHandler,
      this.meetingEndedHandler,
      this.recordingCompletedHandler,
    ];

    return handlers.find(handler => handler.supports(event)) || null;
  }

  /**
   * 获取支持的事件类型列表
   */
  getSupportedEvents(): string[] {
    return [
      'meeting.started',
      'meeting.end',
      'recording.completed',
    ];
  }
}