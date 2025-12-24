import { Injectable, Logger } from '@nestjs/common';
import {
  TencentEventOperator,
  TencentEventMeetingInfo,
  TencentMeetingCreator,
} from '../types';
import { TencentEventUtils } from '../utils/tencent-event.utils';
import {
  MeetingBitableRepository,
  MeetingUserBitableRepository,
  RecordingFileBitableRepository,
} from '@/integrations/lark/repositories';

/**
 * 会议记录服务
 * 提供会议记录的创建和更新功能，供多个事件处理器共享使用
 */
@Injectable()
export class MeetingBitableService {
  private readonly logger = new Logger(MeetingBitableService.name);

  constructor(
    private readonly meetingBitable: MeetingBitableRepository,
    private readonly meetingUserBitable: MeetingUserBitableRepository,
    private readonly recordingFileBitable: RecordingFileBitableRepository,
  ) {}

  /**
   * 创建或更新会议用户记录
   * @param user 用户信息
   */
  async upsertMeetingUserRecord(
    user: TencentEventOperator | TencentMeetingCreator,
  ): Promise<string> {
    try {
      const result = await this.meetingUserBitable.upsertMeetingUserRecord({
        uuid: user.uuid,
        userid: user.userid,
        user_name: user.user_name,
        is_enterprise_user: !!user.userid,
      });

      return result.data?.record?.record_id || '';
    } catch (error) {
      throw new Error(
        `Failed to upsert meeting user record for user ${user.uuid}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 根据UUID查找会议用户记录
   * @param uuid 用户UUID
   */
  async findMeetingUserByUuid(uuid: string) {
    try {
      return await this.meetingUserBitable.searchMeetingUserByUuid(uuid);
    } catch (error) {
      throw new Error(
        `Failed to find meeting user record for uuid ${uuid}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 更新会议记录
   * @param meetingInfo 会议信息
   * @param operator 操作者信息
   */
  async updateMeetingParticipants(
    meetingInfo: TencentEventMeetingInfo,
    operator?: TencentEventOperator,
  ): Promise<void> {
    try {
      // 查找现有会议记录
      const meetingRecord = await this.meetingBitable.searchMeetingById(
        meetingInfo.meeting_id,
        meetingInfo.sub_meeting_id,
      );

      // 获取现有参与者列表
      const participantsField = meetingRecord.data?.items?.[0]?.fields
        .participants as { link_record_ids: string[] } | undefined;
      const record_ids = participantsField?.link_record_ids || [];

      // 查找操作者记录ID
      let operator_id: string | undefined;

      if (operator) {
        const userRecord = await this.findMeetingUserByUuid(operator.uuid);
        operator_id = userRecord.data?.items?.[0]?.record_id;

        if (!operator_id) {
          operator_id = await this.upsertMeetingUserRecord(operator);
        }
      }

      // 查找创建者记录ID
      const creatorRecord = await this.findMeetingUserByUuid(
        meetingInfo.creator.uuid,
      );

      let creator_record_id = creatorRecord.data?.items?.[0]?.record_id;

      if (!creator_record_id) {
        creator_record_id = await this.upsertMeetingUserRecord(
          meetingInfo.creator,
        );
      }

      // 更新参与者列表，确保不重复
      const participants = [...record_ids];

      // 添加操作者到参与者列表
      if (operator_id) {
        participants.push(operator_id);
      }

      // 添加创建者到参与者列表
      if (creator_record_id && !participants.includes(creator_record_id)) {
        participants.push(creator_record_id);
      }

      // 去重
      const uniqueParticipants = Array.from(new Set(participants));

      // 获取会议类型描述
      const meetingTypeDesc = TencentEventUtils.getMeetingTypeDesc(
        meetingInfo.meeting_type,
      );

      // 更新会议记录
      await this.meetingBitable.upsertMeetingRecord({
        platform: 'TENCENT_MEETING',
        subject: meetingInfo.subject,
        meeting_id: meetingInfo.meeting_id,
        sub_meeting_id: meetingInfo.sub_meeting_id,
        meeting_code: meetingInfo.meeting_code,
        start_time: meetingInfo.start_time * 1000,
        end_time: meetingInfo.end_time * 1000,
        meeting_type: meetingTypeDesc,
        participants: uniqueParticipants,
        creator: creator_record_id ? [creator_record_id] : [],
      });
    } catch (error) {
      throw new Error(
        `Failed to update meeting participants for meeting ${meetingInfo.meeting_id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 创建或更新会议记录
   * @param meetingInfo 会议信息
   * @param creatorRecordId 创建者记录ID
   * @param participants 参与者记录ID列表
   */
  async upsertMeetingRecord(
    meetingInfo: TencentEventMeetingInfo,
    creatorRecordId: string = '',
    participants: string[] = [],
  ): Promise<void> {
    try {
      // 获取会议类型描述
      const meetingTypeDesc = TencentEventUtils.getMeetingTypeDesc(
        meetingInfo.meeting_type,
      );

      // 创建或更新会议记录
      await this.meetingBitable.upsertMeetingRecord({
        platform: 'TENCENT_MEETING',
        subject: meetingInfo.subject,
        meeting_id: meetingInfo.meeting_id,
        sub_meeting_id: meetingInfo.sub_meeting_id,
        meeting_code: meetingInfo.meeting_code,
        start_time: meetingInfo.start_time * 1000,
        end_time: meetingInfo.end_time * 1000,
        meeting_type: meetingTypeDesc,
        creator: creatorRecordId ? [creatorRecordId] : [],
        participants,
      });
    } catch (error) {
      throw new Error(
        `Failed to upsert meeting record for meeting ${meetingInfo.meeting_id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 创建或更新会议记录并返回记录ID
   * @param meetingInfo 会议信息
   * @returns 会议记录ID
   */
  async createMeetingRecord(
    meetingInfo: TencentEventMeetingInfo,
  ): Promise<string | undefined> {
    try {
      const meetingResult = await this.meetingBitable.upsertMeetingRecord({
        platform: '腾讯会议',
        subject: meetingInfo.subject,
        meeting_id: meetingInfo.meeting_id,
        sub_meeting_id: meetingInfo.sub_meeting_id,
      });

      if (meetingResult.data?.record) {
        const meetingRecordId = meetingResult.data.record.record_id;
        this.logger.log(`操作者记录ID: ${meetingRecordId}`);
        return meetingRecordId;
      }
      return undefined;
    } catch (error: unknown) {
      this.logger.error(
        `处理录制完成事件失败: ${meetingInfo.meeting_id}`,
        error instanceof Error ? error.stack : undefined,
      );
      // 不抛出错误，避免影响主流程
      return undefined;
    }
  }

  /**
   * 创建或更新录制文件记录
   * @param recordFileId 录制文件ID
   * @param meetingRecordId 会议记录ID
   * @param meetingInfo 会议信息
   * @param fullsummary 会议摘要
   * @param todo 待办事项
   * @param aiMinutes 会议纪要
   * @param uniqueParticipants 参与者列表
   * @param formattedTranscript 格式化转写内容
   * @returns 录制文件记录ID
   */
  async createRecordingFileRecord(
    recordFileId: string,
    meetingRecordId: string | undefined,
    meetingInfo: TencentEventMeetingInfo,
    fullsummary: string,
    todo: string,
    aiMinutes: string,
    uniqueParticipants: any[],
    formattedTranscript: string,
  ): Promise<string | undefined> {
    try {
      const meetIds: string[] = meetingRecordId ? [meetingRecordId] : [];

      const recordingResult =
        await this.recordingFileBitable.upsertRecordingFileRecord({
          record_file_id: recordFileId,
          meet: meetIds,
          start_time: meetingInfo.start_time * 1000,
          end_time: meetingInfo.end_time * 1000,
          fullsummary,
          todo,
          ai_minutes: aiMinutes,
          participants: uniqueParticipants.map((p) => p.user_name).toString(),
          ai_meeting_transcripts: formattedTranscript,
        });

      if (recordingResult.data?.record) {
        const recordingRecordId = recordingResult.data.record.record_id;
        this.logger.log(
          `录制文件记录已创建/更新: ${recordFileId} (记录ID: ${recordingRecordId})`,
        );
        return recordingRecordId;
      }
      return undefined;
    } catch (error: unknown) {
      this.logger.error(
        `创建录制文件记录失败: ${recordFileId}`,
        error instanceof Error ? error.stack : undefined,
      );
      return undefined;
    }
  }
}
