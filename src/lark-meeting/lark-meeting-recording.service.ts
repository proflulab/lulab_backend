import { Injectable } from '@nestjs/common';
import * as Lark from '@larksuiteoapi/node-sdk';

@Injectable()
export class LarkMeetingRecordingService {
  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getMeetingRecording(meetingId: string): Promise<string | undefined> {
    const client = new Lark.Client({
      appId: process.env.LARK_APP_ID || process.env.APP_ID!,
      appSecret: process.env.LARK_APP_SECRET || process.env.APP_SECRET!,
      disableTokenCache: false,
    });

    const maxAttempts = 24; // 最多重试 24 次（约 4 分钟）
    const delayMs = 10000; // 每次重试间隔 10 秒

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const resp = await client.vc.v1.meetingRecording.get({
          path: { meeting_id: meetingId },
        });

        const recording = resp.data?.recording;
        if (recording) {
          const url = recording.url;
          let minute_token: string | undefined;
          if (url) {
            try {
              const urlObj = new URL(url);
              minute_token =
                urlObj.searchParams.get('minute_token') || undefined;
            } catch {
              minute_token = undefined;
            }
            if (!minute_token) {
              const lastSegment = url
                .split('?')[0]
                .split('/')
                .filter(Boolean)
                .pop();
              if (lastSegment && lastSegment.length >= 12) {
                minute_token = lastSegment;
              }
            }
          }
          if (minute_token) {
            console.log(
              `[Lark Recording] 第${attempt}次获取成功，minute_token:`,
              minute_token,
            );
            console.log(`[Lark Recording] 第${attempt}次：recording.url=`, url);
            return minute_token;
          } else {
            console.warn(
              `[Lark Recording] 第${attempt}次：未解析到 minute_token，recording.url=`,
              url,
            );
          }
        } else {
          console.warn(
            `[Lark Recording] 第${attempt}次获取到空录制数据，准备重试...`,
          );
        }
      } catch (error: any) {
        const status = error?.response?.status;
        const code = error?.response?.data?.code;
        const msg = error?.response?.data?.msg;
        if (
          status === 400 &&
          (code === 124002 || (msg && /processing/i.test(msg)))
        ) {
          console.warn(
            `[Lark Recording] 第${attempt}次：录制文件仍在处理(code=${code ?? 'unknown'}), ${attempt < maxAttempts ? '等待后重试' : '已达到最大重试次数'}`,
          );
        } else {
          console.error('[Lark Recording] 获取录制失败(非可重试错误):', error);
          return undefined;
        }
      }

      if (attempt < maxAttempts) {
        await this.delay(delayMs);
      }
    }

    console.warn('[Lark Recording] 超过最大重试次数，仍未获取到录制文件');
    return undefined;
  }
}
