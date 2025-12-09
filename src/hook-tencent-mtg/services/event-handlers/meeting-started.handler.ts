import { Injectable } from '@nestjs/common';
import { BaseEventHandler } from './base-event.handler';
import {
  TencentEventPayload,
  TencentMeetingEventUtils,
} from '../../types/tencent-webhook-events.types';
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
    const meetingTypeDescription =
      TencentMeetingEventUtils.getMeetingTypeDescription(meeting_type);

    this.logger.log(
      `会议开始 [${index}]: ${subject} (${meeting_code}) - ${meetingTypeDescription}`,
    );

    this.logEventProcessing(this.SUPPORTED_EVENT, payload, index);

    // 创建或更新用户信息
    let operatorRecordId;
    try {
      const operatorResult =
        await this.meetingUserBitable.upsertMeetingUserRecord({
          uuid: operator.uuid,
          userid: operator.userid,
          user_name: operator.user_name,
          is_enterprise_user: !!operator.userid, // 如果userid不为空则为true，否则为false
        });
      if (operatorResult.data?.record) {
        operatorRecordId = operatorResult.data.record.record_id;
        this.logger.log(`操作者记录ID: ${operatorRecordId}`);
      }
      this.logger.log(
        `成功处理用户信息: ${operator.user_name} (${operator.uuid})`,
      );
    } catch (error) {
      this.logger.error(`处理用户信息失败: ${operator.uuid}`, error);
      // 不抛出错误，避免影响主流程
    }

    let creatorRecordId;
    try {
      const creatorResult =
        await this.meetingUserBitable.upsertMeetingUserRecord({
          uuid: creator.uuid,
          userid: creator.userid,
          user_name: creator.user_name,
          is_enterprise_user: !!creator.userid, // 如果userid不为空则为true，否则为false
        });

      if (creatorResult.data?.record) {
        creatorRecordId = creatorResult.data.record.record_id;
        this.logger.log(`创建者记录ID: ${creatorRecordId}`);
      }
      this.logger.log(
        `成功处理用户信息: ${creator.user_name} (${creator.uuid})`,
      );
    } catch (error) {
      this.logger.error(`处理用户信息失败: ${creator.uuid}`, error);
      // 不抛出错误，避免影响主流程
    }

    try {
      await this.MeetingBitable.upsertMeetingRecord({
        platform: '腾讯会议',
        subject,
        meeting_id,
        sub_meeting_id,
        meeting_code,
        start_time: start_time * 1000,
        end_time: end_time * 1000,
        creator: [creatorRecordId || ''],
        meeting_type: [meetingTypeDescription || ''],
      });
    } catch (error) {
      this.logger.error(
        `处理会议开始事件失败: ${meeting_info.meeting_id} (${meetingTypeDescription})`,
        error,
      );
      // 不抛出错误，避免影响主流程
    }
  }
}
