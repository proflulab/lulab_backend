import { Injectable } from '@nestjs/common';
import { BaseEventHandler } from './base-event.handler';
import {
  TencentEventPayload,
  TencentEventUtils,
  TencentMeetingCreator,
  TencentEventOperator,
  TencentEventMeetingInfo,
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
    const { creator } = meeting_info;
    const meetingTypeDesc = TencentEventUtils.getMeetingTypeDesc(
      meeting_info.meeting_type,
    );

    this.logMeetingStart(index, meeting_info, meetingTypeDesc);
    this.logEventProcessing(this.SUPPORTED_EVENT, payload, index);

    const userRecords = await this.processUserRecords(
      operator,
      creator,
    );

    const creatorRecordId = this.getCreatorRecordId(
      userRecords,
      operator,
      creator,
    );

    this.logUserProcessingErrors(userRecords, operator, creator);

    await this.createOrUpdateMeetingRecord(
      meeting_info,
      meetingTypeDesc,
      creatorRecordId,
    );
  }

  /**
   * 记录会议开始日志
   */
  private logMeetingStart(
    index: number,
    meetingInfo: TencentEventMeetingInfo,
    meetingTypeDesc: string,
  ): void {
    const { subject, meeting_code } = meetingInfo;
    this.logger.log(
      `会议开始 [${index}]: ${subject} (${meeting_code}) - ${meetingTypeDesc}`,
    );
  }

  /**
   * 处理用户记录（操作者和创建者）
   */
  private async processUserRecords(
    operator: TencentEventOperator,
    creator: TencentMeetingCreator,
  ): Promise<PromiseSettledResult<string>[]> {
    const isSameUser = operator.uuid === creator.uuid;

    if (isSameUser) {
      const result = await Promise.allSettled([
        this.processUserRecord(operator, '操作者/创建者'),
      ]);
      return [result[0], result[0]]; // 操作者和创建者是同一人
    }

    return await Promise.allSettled([
      this.processUserRecord(operator, '操作者'),
      this.processUserRecord(creator, '创建者'),
    ]);
  }

  /**
   * 获取创建者记录ID
   */
  private getCreatorRecordId(
    userRecords: PromiseSettledResult<string>[],
    operator: TencentEventOperator,
    creator: TencentMeetingCreator,
  ): string {
    const isSameUser = operator.uuid === creator.uuid;
    const creatorRecordIndex = isSameUser ? 0 : 1;
    const creatorRecord = userRecords[creatorRecordIndex];

    return creatorRecord.status === 'fulfilled' ? creatorRecord.value : '';
  }

  /**
   * 记录用户处理错误
   */
  private logUserProcessingErrors(
    userRecords: PromiseSettledResult<string>[],
    operator: TencentEventOperator,
    creator: TencentMeetingCreator,
  ): void {
    const isSameUser = operator.uuid === creator.uuid;
    const [operatorRecord, creatorRecord] = userRecords;

    if (operatorRecord.status === 'rejected') {
      this.logger.error(
        `处理操作者信息失败: ${operator.uuid}`,
        operatorRecord.reason,
      );
    }

    if (!isSameUser && creatorRecord.status === 'rejected') {
      this.logger.error(
        `处理创建者信息失败: ${creator.uuid}`,
        creatorRecord.reason,
      );
    }
  }

  /**
   * 创建或更新会议记录
   */
  private async createOrUpdateMeetingRecord(
    meetingInfo: TencentEventMeetingInfo,
    meetingTypeDesc: string,
    creatorRecordId: string,
  ): Promise<void> {
    try {
      await this.meetingBitable.upsertMeetingRecord({
        platform: this.PLATFORM_NAME,
        subject: meetingInfo.subject,
        meeting_id: meetingInfo.meeting_id,
        sub_meeting_id: meetingInfo.sub_meeting_id,
        meeting_code: meetingInfo.meeting_code,
        start_time: meetingInfo.start_time * 1000,
        end_time: meetingInfo.end_time * 1000,
        creator: creatorRecordId ? [creatorRecordId] : [],
        meeting_type: meetingTypeDesc ? [meetingTypeDesc] : [],
      });

      this.logger.log(
        `会议记录处理成功: ${meetingInfo.meeting_id} (${meetingTypeDesc})`,
      );
    } catch (error) {
      this.logger.error(
        `处理会议开始事件失败: ${meetingInfo.meeting_id} (${meetingTypeDesc})`,
        error,
      );
      throw error;
    }
  }

  /**
   * 处理用户记录的创建或更新
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
        is_enterprise_user: !!user.userid,
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
      throw error;
    }
  }
}
