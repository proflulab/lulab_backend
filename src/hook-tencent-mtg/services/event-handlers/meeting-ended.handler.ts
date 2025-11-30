import { Injectable, Logger } from '@nestjs/common';
import { BaseEventHandler } from './base-event.handler';
// import { TencentMeetingType } from '../../enums/tencent-webhook-events.enum';
import { MeetingRepository } from '@/meeting/repositories/meeting.repository';
// import { MeetingPlatform, MeetingType, ProcessingStatus } from '@prisma/client';
import { TencentMeetingQueueService } from '../tencent-meeting-queue.service';
import {
  TencentEventPayload,
  TencentMeetingUser,
  // TencentMeetingEventUtils,
} from '../../types/tencent-webhook-events.types';

/**
 * 会议结束事件处理器
 */
@Injectable()
export class MeetingEndedHandler extends BaseEventHandler {
  private readonly SUPPORTED_EVENT = 'meeting.end';
  protected readonly logger = new Logger(MeetingEndedHandler.name);

  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly queueService: TencentMeetingQueueService,
  ) {
    super();
  }

  supports(event: string): boolean {
    return event === this.SUPPORTED_EVENT;
  }

  async handle(payload: TencentEventPayload, index: number): Promise<void> {
    const { meeting_info, operator } = payload;
    const { creator } = meeting_info;

    // 记录会议信息
    this.logger.log(
      `会议结束 [${index}]: ${meeting_info.subject} (${meeting_info.meeting_code})`,
    );

    // 2. 并发处理用户入队 (操作者 & 创建者)
    // 使用 Promise.allSettled 确保一个失败不影响另一个
    const userUpsertPromises: Promise<void>[] = [];

    if (operator?.uuid) {
      userUpsertPromises.push(this.enqueueUser(operator, '操作者'));
    }

    if (creator?.uuid) {
      // 这里的 creator 逻辑和 operator 是一样的，去重处理
      // 注意：如果 creator 和 operator 是同一个人，这里会重复入队，
      // 可以在这里做个去重判断，或者交给 QueueService 去重
      if (creator.uuid !== operator?.uuid) {
        userUpsertPromises.push(this.enqueueUser(creator, '创建者'));
      }
    }

    // 不阻塞主流程，等待入队结果
    await Promise.allSettled(userUpsertPromises);

    try {
      await this.queueService.enqueueUpsertMeetingRecord({
        platform: '腾讯会议',
        subject: meeting_info.subject,
        meeting_id: meeting_info.meeting_id,
        sub_meeting_id: meeting_info.sub_meeting_id,
        meeting_code: meeting_info.meeting_code,
        start_time: meeting_info.start_time * 1000,
        end_time: meeting_info.end_time * 1000,
        // 由于改为异步入队，这里无法立即获取 record_id，暂时传空
        creator: [],
      });
    } catch (error) {
      this.logger.error(
        `处理会议结束事件失败(入队): ${meeting_info.meeting_id}`,
        error,
      );
      // 不抛出错误，避免影响主流程
    }

    // 同步写入本地数据库（upsert 会议记录）
    // try {
    //   const actualStartMs =
    //     (TencentMeetingEventUtils.getActualStartTime(meeting_info) || 0) * 1000;
    //   const actualEndMs =
    //     (TencentMeetingEventUtils.getActualEndTime(meeting_info) || 0) * 1000;
    //   const durationSeconds = Math.max(
    //     0,
    //     Math.round((actualEndMs - actualStartMs) / 1000),
    //   );

    //   const prismaMeetingType: MeetingType | undefined =
    //     meeting_info.meeting_type === TencentMeetingType.RECURRING
    //       ? MeetingType.RECURRING
    //       : MeetingType.SCHEDULED;

    //   await this.meetingRepository.upsertMeetingRecord({
    //     platform: MeetingPlatform.TENCENT_MEETING,
    //     platformMeetingId: meeting_info.meeting_id,
    //     title: meeting_info.subject,
    //     meetingCode: meeting_info.meeting_code,
    //     type: prismaMeetingType,
    //     hostUserId: creator.userid,
    //     hostUserName: creator.user_name,
    //     startTime: new Date(actualStartMs),
    //     endTime: new Date(actualEndMs),
    //     durationSeconds,
    //     hasRecording: false,
    //     recordingStatus: ProcessingStatus.PENDING,
    //     processingStatus: ProcessingStatus.PENDING,
    //     metadata: {
    //       subMeetingId: meeting_info.sub_meeting_id,
    //       rawMeetingInfo: meeting_info,
    //       operator,
    //       source: 'meeting.end',
    //     },
    //   });
    // } catch (error) {
    //   this.logger.error(
    //     `本地数据库 upsert 会议记录失败: ${meeting_info.meeting_id}`,
    //     error instanceof Error ? error.stack : undefined,
    //   );
    //   // 不抛出错误，避免影响主流程
    // }
  }

  /**
   * 封装用户入队逻辑，减少重复代码
   */
  private async enqueueUser(
    user: TencentMeetingUser,
    roleLabel: string,
  ): Promise<void> {
    try {
      await this.queueService.enqueueUpsertMeetingUser({
        uuid: user.uuid,
        userid: user.userid,
        user_name: user.user_name,
        is_enterprise_user: !!user.userid,
      });
      this.logger.log(
        `已入队处理${roleLabel}信息: ${user.user_name} (${user.uuid})`,
      );
    } catch (error) {
      this.logger.error(`入队处理${roleLabel}信息失败: ${user.uuid}`, error);
      // 这里可以选择 throw error 让 Promise.allSettled 捕获，或者仅记录日志
    }
  }
}
