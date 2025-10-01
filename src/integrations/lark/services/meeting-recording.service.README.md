# 飞书会议录制服务 (MeetingRecordingService)

这个服务提供了飞书会议录制文件的获取、授权和管理功能。

## 功能特性

- **获取会议录制文件信息** - 获取会议的录制状态和文件详情
- **授权录制文件访问** - 将录制文件授权给组织、用户或公开访问
- **获取录制文件列表** - 获取会议的所有录制文件
- **获取下载链接** - 获取录制文件的直接下载链接
- **批量操作** - 批量获取多个会议的录制信息
- **连接测试** - 测试飞书API连接状态

## 使用前提

1. 会议必须已经结束
2. 必须收到"录制完成"事件 (`vc.meeting.recording_ready_v1`)
3. 只有会议owner（通过开放平台预约的会议即为预约人）有权限操作

## API 方法

### getMeetingRecording(meetingId, userAccessToken?)

获取会议录制文件信息。

```typescript
const response = await meetingRecordingService.getMeetingRecording('meeting-id');
if (response.code === 0) {
  console.log('录制状态:', response.data?.recording_status);
  console.log('录制文件URL:', response.data?.recording?.url);
}
```

### authorizeMeetingRecording(meetingId, permission, userAccessToken?)

授权会议录制文件访问权限。

```typescript
// 授权给组织
await meetingRecordingService.authorizeMeetingRecording('meeting-id', {
  type: 'organization'
});

// 授权给特定用户
await meetingRecordingService.authorizeMeetingRecording('meeting-id', {
  type: 'user',
  scope: ['user-id-1', 'user-id-2']
});

// 公开到公网
await meetingRecordingService.authorizeMeetingRecording('meeting-id', {
  type: 'public'
});
```

### getRecordingFiles(meetingId, userAccessToken?)

获取会议录制文件列表（简化版）。

```typescript
const files = await meetingRecordingService.getRecordingFiles('meeting-id');
files.forEach(file => {
  console.log('文件:', file.file_name);
  console.log('下载链接:', file.download_url);
  console.log('时长:', file.duration, '秒');
});
```

### getRecordingDownloadUrl(meetingId, fileId, userAccessToken?)

获取录制文件的下载链接。

```typescript
const downloadUrl = await meetingRecordingService.getRecordingDownloadUrl(
  'meeting-id',
  'file-id'
);
```

### batchGetMeetingRecordings(meetingIds, userAccessToken?)

批量获取多个会议的录制信息。

```typescript
const meetingIds = ['meeting-1', 'meeting-2', 'meeting-3'];
const recordings = await meetingRecordingService.batchGetMeetingRecordings(meetingIds);

recordings.forEach((recording, meetingId) => {
  console.log(`会议 ${meetingId}:`, recording.recording_status);
});
```

### hasRecordingFiles(meetingId, userAccessToken?)

检查会议是否有录制文件。

```typescript
const hasRecording = await meetingRecordingService.hasRecordingFiles('meeting-id');
console.log('是否有录制文件:', hasRecording);
```

## 在 NestJS 控制器中使用

```typescript
@Controller('meetings')
export class MeetingController {
  constructor(
    private readonly meetingRecordingService: MeetingRecordingService
  ) {}

  @Get(':meetingId/recording')
  async getMeetingRecording(@Param('meetingId') meetingId: string) {
    try {
      const response = await this.meetingRecordingService.getMeetingRecording(meetingId);
      return {
        success: response.code === 0,
        data: response.data,
        message: response.msg
      };
    } catch (error) {
      return {
        success: false,
        message: '获取录制信息失败'
      };
    }
  }
}
```

## 错误处理

服务会自动处理飞书API的错误响应，并在失败时抛出异常。建议在使用时添加适当的错误处理：

```typescript
try {
  const response = await meetingRecordingService.getMeetingRecording('meeting-id');
  // 处理成功响应
} catch (error) {
  console.error('操作失败:', error);
  // 处理错误情况
}
```

## 相关文档

- [飞书会议录制API文档](https://open.feishu.cn/document/server-docs/vc-v1/meeting-recording/get)
- [飞书会议录制授权API文档](https://open.feishu.cn/document/server-docs/vc-v1/meeting-recording/set_permission)
- [飞书会议事件类型](https://open.feishu.cn/document/server-docs/vc-v1/meeting/events)

## 测试

运行单元测试：

```bash
npm test -- meeting-recording.service.spec.ts
```

查看使用示例：

```typescript
// 查看详细的使用示例
import './meeting-recording.service.example';
```