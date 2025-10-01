/**
 * 飞书会议录制服务使用示例
 * 
 * 这个文件展示了如何使用 MeetingRecordingService 来获取和管理会议录制文件
 */

import { MeetingRecordingService } from './meeting-recording.service';

// 示例1: 获取会议录制文件信息
async function getMeetingRecordingExample(meetingRecordingService: MeetingRecordingService) {
  
  try {
    // 获取会议录制信息（需要会议结束后并且收到"录制完成"事件后）
    const response = await meetingRecordingService.getMeetingRecording('your-meeting-id');
    
    if (response.code === 0 && response.data) {
      console.log('录制状态:', response.data.recording_status);
      console.log('录制开始时间:', new Date(response.data.recording_start_time!));
      console.log('录制结束时间:', new Date(response.data.recording_end_time!));
      
      if (response.data.recording?.url) {
        console.log('录制文件URL:', response.data.recording.url);
        console.log('录制时长:', response.data.recording.duration, '秒');
      }
    } else {
      console.error('获取录制信息失败:', response.msg);
    }
  } catch (error) {
    console.error('获取录制信息出错:', error);
  }
}

// 示例2: 授权录制文件访问权限
async function authorizeRecordingExample(meetingRecordingService: MeetingRecordingService) {
  
  try {
    // 授权给组织内所有成员
    const orgResult = await meetingRecordingService.authorizeMeetingRecording(
      'your-meeting-id',
      { type: 'organization' }
    );
    
    if (orgResult.code === 0 && orgResult.data?.authorized) {
      console.log('组织授权成功');
    }
    
    // 授权给特定用户
    const userResult = await meetingRecordingService.authorizeMeetingRecording(
      'your-meeting-id',
      { 
        type: 'user',
        scope: ['user_id_1', 'user_id_2']
      }
    );
    
    if (userResult.code === 0 && userResult.data?.authorized) {
      console.log('用户授权成功');
    }
    
    // 公开到公网
    const publicResult = await meetingRecordingService.authorizeMeetingRecording(
      'your-meeting-id',
      { type: 'public' }
    );
    
    if (publicResult.code === 0 && publicResult.data?.authorized) {
      console.log('公开授权成功');
    }
  } catch (error) {
    console.error('授权失败:', error);
  }
}

// 示例3: 获取录制文件列表
async function getRecordingFilesExample(meetingRecordingService: MeetingRecordingService) {
  
  try {
    // 获取录制文件列表
    const files = await meetingRecordingService.getRecordingFiles('your-meeting-id');
    
    console.log(`找到 ${files.length} 个录制文件:`);
    files.forEach((file, index) => {
      console.log(`文件 ${index + 1}:`);
      console.log('  文件ID:', file.file_id);
      console.log('  文件名:', file.file_name);
      console.log('  文件大小:', file.file_size, '字节');
      console.log('  录制时长:', file.duration, '秒');
      console.log('  下载链接:', file.download_url);
      console.log('  创建时间:', new Date(file.created_time));
    });
  } catch (error) {
    console.error('获取录制文件列表失败:', error);
  }
}

// 示例4: 获取录制文件下载链接
async function getDownloadUrlExample(meetingRecordingService: MeetingRecordingService) {
  
  try {
    // 首先获取录制文件列表
    const files = await meetingRecordingService.getRecordingFiles('your-meeting-id');
    
    if (files.length > 0) {
      // 获取第一个文件的下载链接
      const downloadUrl = await meetingRecordingService.getRecordingDownloadUrl(
        'your-meeting-id',
        files[0].file_id
      );
      
      if (downloadUrl) {
        console.log('下载链接:', downloadUrl);
      }
    }
  } catch (error) {
    console.error('获取下载链接失败:', error);
  }
}

// 示例5: 批量获取多个会议的录制信息
async function batchGetRecordingsExample(meetingRecordingService: MeetingRecordingService) {
  
  try {
    const meetingIds = ['meeting-id-1', 'meeting-id-2', 'meeting-id-3'];
    
    // 批量获取录制信息
    const recordings = await meetingRecordingService.batchGetMeetingRecordings(meetingIds);
    
    recordings.forEach((recordingInfo, meetingId) => {
      console.log(`会议 ${meetingId}:`);
      console.log('  录制状态:', recordingInfo.recording_status);
      console.log('  录制文件数量:', recordingInfo.recording_files.length);
      
      if (recordingInfo.recording_files.length > 0) {
        console.log('  第一个文件:', recordingInfo.recording_files[0].file_name);
      }
    });
  } catch (error) {
    console.error('批量获取录制信息失败:', error);
  }
}

// 示例6: 检查会议是否有录制文件
async function checkRecordingExistenceExample(meetingRecordingService: MeetingRecordingService) {
  
  try {
    const hasRecording = await meetingRecordingService.hasRecordingFiles('your-meeting-id');
    
    if (hasRecording) {
      console.log('该会议有录制文件');
    } else {
      console.log('该会议没有录制文件');
    }
  } catch (error) {
    console.error('检查录制文件失败:', error);
  }
}

// 示例7: 在NestJS控制器中使用
import { Controller, Get, Param, Query } from '@nestjs/common';

@Controller('meetings')
export class MeetingController {
  constructor(private readonly meetingRecordingService: MeetingRecordingService) {}
  
  @Get(':meetingId/recording')
  async getMeetingRecording(@Param('meetingId') meetingId: string) {
    try {
      const response = await this.meetingRecordingService.getMeetingRecording(meetingId);
      
      if (response.code === 0) {
        return {
          success: true,
          data: response.data,
        };
      } else {
        return {
          success: false,
          message: response.msg,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: '获取录制信息失败',
      };
    }
  }
  
  @Get(':meetingId/recording/files')
  async getRecordingFiles(@Param('meetingId') meetingId: string) {
    try {
      const files = await this.meetingRecordingService.getRecordingFiles(meetingId);
      
      return {
        success: true,
        data: files,
      };
    } catch (error) {
      return {
        success: false,
        message: '获取录制文件列表失败',
      };
    }
  }
  
  @Get(':meetingId/recording/authorize')
  async authorizeRecording(
    @Param('meetingId') meetingId: string,
    @Query('type') type: 'organization' | 'user' | 'public',
  ) {
    try {
      const result = await this.meetingRecordingService.authorizeMeetingRecording(
        meetingId,
        { type }
      );
      
      if (result.code === 0 && result.data?.authorized) {
        return {
          success: true,
          message: '授权成功',
        };
      } else {
        return {
          success: false,
          message: result.msg,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: '授权失败',
      };
    }
  }
}