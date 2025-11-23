import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { MeetingUserBitableRepository } from '@/integrations/lark/repositories';
import type { UpsertMeetingUserJobData } from '../tencent-meeting-queue.service';

@Injectable()
@Processor('tencent-mtg')
export class TencentMeetingProcessor extends WorkerHost {
  private readonly logger = new Logger(TencentMeetingProcessor.name);

  constructor(
    private readonly meetingUserBitable: MeetingUserBitableRepository,
  ) {
    super();
  }

  override async process(
    job: Job<
      {
        uuid: string;
        userid?: string;
        user_name: string;
        is_enterprise_user: boolean;
      },
      unknown,
      string
    >,
  ): Promise<unknown> {
    if (job.name === 'upsertMeetingUser') {
      const res = await this.meetingUserBitable.upsertMeetingUserRecord({
        uuid: job.data.uuid,
        userid: job.data.userid ?? '',
        user_name: job.data.user_name,
        is_enterprise_user: job.data.is_enterprise_user,
      });
      const recordId = res.data?.record?.record_id;
      if (recordId) {
        this.logger.log(`操作者记录ID: ${recordId}`);
      }
      this.logger.log(
        `成功处理用户信息: ${job.data.user_name} (${job.data.uuid})`,
      );
    }
    return { ok: true };
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<UpsertMeetingUserJobData>, err: Error) {
    this.logger.error(`处理用户信息失败: ${job.data.uuid}`, err);
  }
}
