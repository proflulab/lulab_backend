import { Injectable } from '@nestjs/common';
import { BaseEventHandler } from './base-event.handler';
import {
  TencentEventPayload,
  TencentMeetingCreator,
  TencentEventOperator,
  TencentEventMeetingInfo,
} from '../../types';
import { TencentEventUtils } from '../../utils/tencent-event.utils';
import {
  MeetingBitableRepository,
  MeetingUserBitableRepository,
} from '../../../integrations/lark/repositories';
import { PlatformUserRepository } from '../../../user-platform/repositories/platform-user.repository';
import { MeetingRepository } from '../../../meeting/repositories/meeting.repository';
import {
  Platform,
  MeetingPlatform,
  ProcessingStatus,
  PlatformUser,
} from '@prisma/client';

/**
 * 会议开始事件处理器
 */
@Injectable()
export class MeetingStartedHandler extends BaseEventHandler {
  private readonly SUPPORTED_EVENT = 'meeting.started';

  constructor(
    private readonly meetingBitable: MeetingBitableRepository,
    private readonly meetingUserBitable: MeetingUserBitableRepository,
    private readonly platformUserRepository: PlatformUserRepository,
    private readonly meetingRepository: MeetingRepository,
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

    // 处理用户记录（操作者和创建者）- 飞书多维表格
    const userRecords = await this.processUserRecords(operator, creator);

    const creatorRecordId = this.getCreatorRecordId(
      userRecords,
      operator,
      creator,
    );

    this.logUserProcessingErrors(userRecords, operator, creator);

    // 创建或更新平台用户记录 - Prisma数据库
    const [operatorPlatformUser, creatorPlatformUser] =
      await this.processPlatformUsers(operator, creator);

    // 创建或更新会议记录 - Prisma数据库
    await this.createOrUpdateMeetingInDatabase(
      meeting_info,
      operatorPlatformUser,
      creatorPlatformUser,
    );

    // 创建或更新会议记录 - 飞书多维表格
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

  /**
   * 处理平台用户记录的创建或更新 - Prisma数据库
   */
  private async processPlatformUsers(
    operator: TencentEventOperator,
    creator: TencentMeetingCreator,
  ): Promise<[PlatformUser | null, PlatformUser | null]> {
    const isSameUser = operator.uuid === creator.uuid;

    // 处理操作者
    let operatorPlatformUser: PlatformUser | null;
    try {
      operatorPlatformUser = await this.upsertPlatformUser(operator);
      this.logger.log(
        `成功处理操作者平台用户信息: ${operator.user_name} (${operator.uuid})`,
      );
    } catch (error) {
      this.logger.error(`处理操作者平台用户信息失败: ${operator.uuid}`, error);
      operatorPlatformUser = null;
    }

    // 处理创建者
    let creatorPlatformUser: PlatformUser | null;
    if (isSameUser) {
      creatorPlatformUser = operatorPlatformUser;
    } else {
      try {
        creatorPlatformUser = await this.upsertPlatformUser(creator);
        this.logger.log(
          `成功处理创建者平台用户信息: ${creator.user_name} (${creator.uuid})`,
        );
      } catch (error) {
        this.logger.error(`处理创建者平台用户信息失败: ${creator.uuid}`, error);
        creatorPlatformUser = null;
      }
    }

    return [operatorPlatformUser, creatorPlatformUser];
  }

  /**
   * 创建或更新平台用户记录
   */
  private async upsertPlatformUser(
    user: TencentEventOperator | TencentMeetingCreator,
  ): Promise<PlatformUser> {
    return this.platformUserRepository.upsertPlatformUser(
      {
        platform: Platform.TENCENT_MEETING,
        platformUserId: user.userid,
      },
      {
        platform: Platform.TENCENT_MEETING,
        platformUserId: user.userid,
        platformUuid: user.uuid,
        userName: user.user_name,
        platformData: {
          userid: user.userid,
          open_id: user.open_id || '',
          ms_open_id: user.ms_open_id || '',
          instance_id: user.instance_id || '',
        },
      },
      {
        userName: user.user_name,
        platformData: {
          userid: user.userid,
          open_id: user.open_id || '',
          ms_open_id: user.ms_open_id || '',
          instance_id: user.instance_id || '',
        },
      },
    );
  }

  /**
   * 创建或更新会议记录 - Prisma数据库
   */
  private async createOrUpdateMeetingInDatabase(
    meetingInfo: TencentEventMeetingInfo,
    operatorPlatformUser: PlatformUser | null,
    creatorPlatformUser: PlatformUser | null,
  ): Promise<void> {
    try {
      // 确定会议类型
      const meetingType = TencentEventUtils.convertMeetingType(
        meetingInfo.meeting_type as number,
      );

      // 转换时间戳
      const startTime = meetingInfo.start_time
        ? new Date(meetingInfo.start_time * 1000)
        : new Date();
      const endTime = meetingInfo.end_time
        ? new Date(meetingInfo.end_time * 1000)
        : new Date();
      const durationSeconds =
        meetingInfo.end_time && meetingInfo.start_time
          ? meetingInfo.end_time - meetingInfo.start_time
          : 0;

      // 准备会议数据
      const meetingData = {
        title: meetingInfo.subject,
        meetingCode: meetingInfo.meeting_code,
        type: meetingType,
        scheduledStartAt: startTime,
        scheduledEndAt: endTime,
        startAt: startTime,
        endAt: endTime,
        durationSeconds,
        subMeetingId: meetingInfo.sub_meeting_id || null,
        hasRecording: false,
        recordingStatus: ProcessingStatus.PENDING,
        processingStatus: ProcessingStatus.PENDING,
        metadata: {
          meeting_create_mode: meetingInfo.meeting_create_mode,
          meeting_create_from: meetingInfo.meeting_create_from,
          meeting_id_type: meetingInfo.meeting_id_type,
          hosts: meetingInfo.hosts || [],
        },
        createdById: creatorPlatformUser?.id || null,
        hostId: operatorPlatformUser?.id || null,
      };

      // 使用 upsert 创建或更新会议记录
      await this.meetingRepository.upsertMeetingRecord(
        MeetingPlatform.TENCENT_MEETING,
        meetingInfo.meeting_id,
        meetingData,
      );

      this.logger.log(
        `会议数据库记录处理成功: ${meetingInfo.meeting_id} (${meetingInfo.subject})`,
      );
    } catch (error) {
      this.logger.error(
        `处理会议数据库记录失败: ${meetingInfo.meeting_id} (${meetingInfo.subject})`,
        error,
      );
      throw error;
    }
  }
}
