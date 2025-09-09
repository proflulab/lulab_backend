import { Logger } from '@nestjs/common';
import { TencentEventPayload } from '../../types/tencent-webhook-events.types';

/**
 * 事件处理器接口
 */
export interface IEventHandler {
  handle(payload: any, index: number): Promise<void>;
  supports(event: string): boolean;
}

/**
 * 基础事件处理器
 */
export abstract class BaseEventHandler implements IEventHandler {
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly PLATFORM_NAME = 'TENCENT_MEETING';

  abstract handle(payload: any, index: number): Promise<void>;
  abstract supports(event: string): boolean;

  /**
   * 记录事件处理详情
   */
  protected logEventProcessing(eventName: string, payload: any, index: number): void {
    this.logger.log(`处理 ${eventName} 事件 [${index}]`, {
      event: eventName,
      index,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 获取会议创建模式描述
   */
  protected getMeetingModeDesc(mode?: number): string {
    const modes = {
      0: '普通会议',
      1: '快速会议'
    };
    return modes[mode as keyof typeof modes] || '未知模式';
  }

  /**
   * 获取会议创建来源描述
   */
  protected getMeetingSourceDesc(from?: number): string {
    const sources = {
      0: '空来源',
      1: '客户端',
      2: 'web',
      3: '企微',
      4: '微信',
      5: 'outlook',
      6: 'restapi',
      7: '腾讯文档',
      8: 'Rooms 智能录制'
    };
    return sources[from as keyof typeof sources] || '未知来源';
  }

  /**
   * 获取会议类型描述
   */
  protected getMeetingTypeDesc(type: number): string {
    const types = {
      0: '一次性会议',
      1: '周期性会议',
      2: '微信专属会议',
      4: 'rooms 投屏会议',
      5: '个人会议号会议'
    };
    return types[type as keyof typeof types] || '未知类型';
  }
}