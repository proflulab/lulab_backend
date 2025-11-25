/*
 * @Author: Mingxuan 159552597+Luckymingxuan@users.noreply.github.com
 * @Date: 2025-10-03 15:11:09
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-11-25 22:55:40
 * @FilePath: /lulab_backend/src/integrations/lark/services/meeting-recording.service.spec.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  MeetingRecordingService,
  GetMeetingRecordingResponse,
} from './meeting-recording.service';
import { LarkClient } from '../lark.client';

describe('MeetingRecordingService', () => {
  let service: MeetingRecordingService; // 测试的服务实例
  let mockLarkClient: Partial<LarkClient>; // 用于模拟 LarkClient 的部分方法

  beforeEach(async () => {
    // 创建 LarkClient 的 mock 对象
    // 这里只模拟 vc.v1.meetingRecording.get 方法，返回固定的录制文件数据
    type MeetingRecordingGet = (args: {
      path: { meeting_id: string };
    }) => Promise<{
      data: GetMeetingRecordingResponse;
    }>;

    const getMock: jest.MockedFunction<MeetingRecordingGet> = jest.fn(
      async (args) => {
        void args;
        return Promise.resolve({
          data: {
            recording: {
              url: 'https://example.com/recording.mp4',
              duration: '3600',
            },
          },
        });
      },
    );

    mockLarkClient = {
      vc: {
        v1: {
          meetingRecording: {
            get: getMock,
          },
        },
      },
    } as unknown as Partial<LarkClient>;

    // 创建 NestJS 测试模块
    // 使用 mockLarkClient 替代真实的 LarkClient
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingRecordingService,
        { provide: LarkClient, useValue: mockLarkClient },
      ],
    }).compile();

    // 从测试模块中获取服务实例
    service = module.get<MeetingRecordingService>(MeetingRecordingService);
  });

  // 基础测试：服务实例是否被正确创建
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // 功能测试：getMeetingRecording 方法是否正确返回录制文件信息
  it('should get meeting recording successfully', async () => {
    // 调用服务方法，模拟传入会议ID
    const result: GetMeetingRecordingResponse =
      await service.getMeetingRecordingInfo('test-meeting-id');

    // 验证返回的录制文件信息是否正确
    expect(result.recording?.url).toBe('https://example.com/recording.mp4');
    expect(result.recording?.duration).toBe('3600');

    // 验证 get 方法是否被调用，并且传入了正确的参数
    expect(mockLarkClient.vc?.v1?.meetingRecording?.get).toHaveBeenCalledWith({
      path: { meeting_id: 'test-meeting-id' },
    });
  });
});
