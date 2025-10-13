// 会议详情服务
import { Injectable, Logger } from '@nestjs/common';
import { LarkClient } from '@lark/lark.client';

export interface MeetingListParams {
  start_time: string | number | Date;
  end_time: string | number | Date;
  page_size?: number;
  page_token?: string;
}

@Injectable()
export class LarkMeetingDetailService {
  private readonly logger = new Logger(LarkMeetingDetailService.name);

  constructor(private readonly larkClient: LarkClient) {}

  private toTimestampString(input: string | number | Date): string {
    if (input instanceof Date) {
      return Math.floor(input.getTime() / 1000).toString();
    }
    if (typeof input === 'number') {
      return Math.floor(input).toString();
    }
    return input;
  }

  async getMeetingList(params: MeetingListParams): Promise<any> {
    const res = await this.larkClient.vc.v1.meetingList.get({
      params: {
        start_time: this.toTimestampString(params.start_time),
        end_time: this.toTimestampString(params.end_time),
        page_size: params.page_size ?? 20,
        page_token: params.page_token,
      },
    });
    return res.data ?? {};
  }

  async *iterateMeetingList(
    params: MeetingListParams,
  ): AsyncGenerator<any, void, unknown> {
    const iterator = await this.larkClient.vc.v1.meetingList.getWithIterator({
      params: {
        start_time: this.toTimestampString(params.start_time),
        end_time: this.toTimestampString(params.end_time),
        page_size: params.page_size ?? 20,
      },
    });
    for await (const item of iterator) {
      yield item;
    }
  }
}