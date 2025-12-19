import { Injectable } from '@nestjs/common';
import { BaseEventHandler } from './base-event.handler';
import {
  TencentEventPayload,
  TencentEventUtils,
  TencentMeetingCreator,
  TencentEventOperator,
} from '../../types';
import {
  MeetingBitableRepository,
  MeetingUserBitableRepository,
} from '../../../integrations/lark/repositories';

/**
 * 会议开始事件处理器
 */
@Injectable()
export class MeetingStartedHandler extends BaseEventHandler {
  private readonly SUPPORTED_EVENT = 'meeting.started';

  constructor(
    private readonly MeetingBitable: MeetingBitableRepository,
    private readonly meetingUserBitable: MeetingUserBitableRepository,
  ) {
    super();
  }

  supports(event: string): boolean {
    return event === this.SUPPORTED_EVENT;
  }

  async handle(payload: TencentEventPayload, index: number): Promise<void> {
    const { meeting_info, operator } = payload;
    const {
      creator,
      meeting_id,
      meeting_code,
      subject,
      meeting_type,
      sub_meeting_id,
      start_time,
      end_time,
    } = meeting_info;

    // 记录会议信息
    const typeDesc =
      TencentEventUtils.getMeetingTypeDesc(meeting_type);

    this.logger.log(
      `会议开始 [${index}]: ${subject} (${meeting_code}) - ${typeDesc}`,
    );

    this.logEventProcessing(this.SUPPORTED_EVENT, payload, index);

    // 判断操作者和创建者是否为同一人
    const isSameUser = operator.uuid === creator.uuid;

    // 处理用户信息，避免重复处理同一用户
    let operatorRecordId: PromiseSettledResult<string>;
    let creatorRecordId: PromiseSettledResult<string>;

    if (isSameUser) {
      // 如果是同一人，只处理一次
      const result = await Promise.allSettled([
        this.processUserRecord(operator, '操作者/创建者'),
      ]);
      operatorRecordId = result[0];
      creatorRecordId = result[0];
    } else {
      // 如果是不同的人，分别处理
      const results = await Promise.allSettled([
        this.processUserRecord(operator, '操作者'),
        this.processUserRecord(creator, '创建者'),
      ]);
      operatorRecordId = results[0];
      creatorRecordId = results[1];
    }

    // 获取记录ID，如果处理失败则使用空字符串
    const creatorId =
      creatorRecordId.status === 'fulfilled' ? creatorRecordId.value : '';

    // 记录处理失败的用户信息
    if (operatorRecordId.status === 'rejected') {
      this.logger.error(
        `处理操作者信息失败: ${operator.uuid}`,
        operatorRecordId.reason,
      );
    }

    // 只有当操作者和创建者不是同一人时，才单独记录创建者的错误
    if (!isSameUser && creatorRecordId.status === 'rejected') {
      this.logger.error(
        `处理创建者信息失败: ${creator.uuid}`,
        creatorRecordId.reason,
      );
    }

    // 创建或更新会议记录
    try {
      await this.MeetingBitable.upsertMeetingRecord({
        platform: this.PLATFORM_NAME,
        subject,
        meeting_id,
        sub_meeting_id,
        meeting_code,
        start_time: start_time * 1000,
        end_time: end_time * 1000,
        creator: creatorId ? [creatorId] : [],
        meeting_type: typeDesc ? [typeDesc] : [],
      });

      this.logger.log(
        `会议记录处理成功: ${meeting_id} (${typeDesc})`,
      );
    } catch (error) {
      this.logger.error(
        `处理会议开始事件失败: ${meeting_id} (${typeDesc})`,
        error,
      );
      throw error; // 会议记录创建失败应该抛出异常
    }
  }

  /**
   * 处理用户记录的创建或更新
   * @param user 用户信息（操作者或创建者）
   * @param userType 用户类型，用于日志记录
   * @returns 用户记录ID，如果处理失败则返回空字符串
   */
  private async processUserRecord(
    user: TencentEventOperator | TencentMeetingCreator,
    userType: string,
  ): Promise<string> {
    try {
      const result = await this.meetingUserBitable.upsertMeetingUserRecord({
        uuid: user.uuid,
        userid: user.userid,
        user_name: user.user_name,
        is_enterprise_user: !!user.userid, // 如果userid不为空则为true，否则为false
      });

      const recordId = result.data?.record?.record_id || '';
      if (recordId) {
        this.logger.log(`${userType}记录ID: ${recordId}`);
      }

      this.logger.log(
        `成功处理${userType}信息: ${user.user_name} (${user.uuid})`,
      );

      return recordId;
    } catch (error) {
      this.logger.error(`处理${userType}信息失败: ${user.uuid}`, error);
      throw error; // 抛出错误，让调用方决定如何处理
    }
  }
}
