import { Injectable } from '@nestjs/common';
import { BaseEventHandler } from './base-event.handler';
import { TencentEventPayload } from '../../types/tencent-webhook-events.types';
import {
  MeetingBitableRepository,
  MeetingUserBitableRepository,
} from '@/integrations/lark/repositories';

/**
 * 用户入会事件处理器
 * 处理 meeting.participant-joined 事件
 */
@Injectable()
export class MeetingParticipantJoinedHandler extends BaseEventHandler {
  private readonly SUPPORTED_EVENT = 'meeting.participant-joined';

  constructor(
    private readonly meetingBitable: MeetingBitableRepository,
    private readonly meetingUserBitable: MeetingUserBitableRepository,
  ) {
    super();
  }

  supports(event: string): boolean {
    return event === this.SUPPORTED_EVENT;
  }

  async handle(payload: TencentEventPayload, index: number): Promise<void> {
    const { meeting_info, operator } = payload;

    // 验证必要字段
    if (!meeting_info) {
      this.logger.error(`Invalid payload: missing meeting_info`);
      throw new Error('Invalid payload: missing meeting_info');
    }
    if (!operator) {
      this.logger.error(`Invalid payload: missing operator`);
      throw new Error('Invalid payload: missing operator');
    }

    // 记录用户入会信息
    this.logger.log(
      `用户入会 [${index}]: ${operator.user_name} (${operator.uuid}) 加入会议 ${meeting_info.subject} (${meeting_info.meeting_code})`,
    );

    this.logEventProcessing(this.SUPPORTED_EVENT, payload, index);

    // 创建或更新入会用户信息
    let participantRecordId;
    try {
      const participantResult =
        await this.meetingUserBitable.upsertMeetingUserRecord({
          uuid: operator.uuid,
          userid: operator.userid,
          user_name: operator.user_name,
          is_enterprise_user: !!operator.userid, // 如果userid不为空则为true，否则为false
        });
      if (participantResult.data?.record) {
        participantRecordId = participantResult.data.record.record_id;
        this.logger.log(`参会人员记录ID: ${participantRecordId}`);
      }
      this.logger.log(
        `成功处理参会人员信息: ${operator.user_name} (${operator.uuid})`,
      );
    } catch (error) {
      this.logger.error(`处理参会人员信息失败: ${operator.uuid}`, error);
      // 不抛出错误，避免影响主流程
    }

    // 创建或更新会议记录（使用upsert一步到位）
    try {
      const meetingResult = await this.meetingBitable.upsertMeetingRecord({
        platform: '腾讯会议',
        subject: meeting_info.subject,
        meeting_id: meeting_info.meeting_id,
        sub_meeting_id: meeting_info.sub_meeting_id,
        meeting_code: meeting_info.meeting_code,
        start_time: meeting_info.start_time * 1000,
        end_time: meeting_info.end_time * 1000,
      });

      if (meetingResult.data?.record) {
        const meetingRecordsearch = await this.meetingBitable.searchMeetingById(
          meeting_info.meeting_id,
          meeting_info.sub_meeting_id,
        );

        const participantsField = meetingRecordsearch.data?.items[0].fields
          .participants as { link_record_ids: string[] } | undefined;

        await this.meetingBitable.upsertMeetingRecord({
          platform: '腾讯会议',
          meeting_id: meeting_info.meeting_id,
          sub_meeting_id: meeting_info.sub_meeting_id,
          participants: participantRecordId
            ? [
                ...(participantsField?.link_record_ids || []),
                participantRecordId,
              ]
            : participantsField?.link_record_ids || [],
        });
      }
      this.logger.log(`成功处理会议记录: ${meeting_info.meeting_id}`);
    } catch (error) {
      this.logger.error(
        `处理用户入会事件失败: ${meeting_info.meeting_id}`,
        error,
      );
      // 不抛出错误，避免影响主流程
    }
  }
}
