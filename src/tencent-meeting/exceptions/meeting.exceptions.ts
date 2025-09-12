import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 会议相关异常基类
 */
export class MeetingException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super(message, status);
  }
}

/**
 * 会议记录未找到异常
 */
export class MeetingRecordNotFoundException extends MeetingException {
  constructor(meetingId?: string) {
    const message = meetingId
      ? `会议记录未找到: ${meetingId}`
      : '会议记录未找到';
    super(message, HttpStatus.NOT_FOUND);
  }
}

/**
 * 会议记录已存在异常
 */
export class MeetingRecordAlreadyExistsException extends MeetingException {
  constructor(platformMeetingId: string, platformRecordingId: string) {
    super(
      `会议记录已存在: 会议ID=${platformMeetingId}, 录制ID=${platformRecordingId}`,
      HttpStatus.CONFLICT,
    );
  }
}

/**
 * 平台API调用异常
 */
export class PlatformApiException extends MeetingException {
  constructor(platform: string, operation: string, error: string) {
    super(
      `${platform} API调用失败 [${operation}]: ${error}`,
      HttpStatus.BAD_GATEWAY,
    );
  }
}

/**
 * 文件下载异常
 */
export class FileDownloadException extends MeetingException {
  constructor(url: string, error: string) {
    super(`文件下载失败 [${url}]: ${error}`, HttpStatus.BAD_GATEWAY);
  }
}

/**
 * 参数验证异常
 */
export class MeetingValidationException extends MeetingException {
  constructor(field: string, value: any, requirement: string) {
    super(
      `参数验证失败: ${field}=${value}, 要求: ${requirement}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * 平台配置异常
 */
export class PlatformConfigException extends MeetingException {
  constructor(platform: string, configKey: string) {
    super(
      `平台配置缺失: ${platform}.${configKey}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * 会议状态异常
 */
export class MeetingStatusException extends MeetingException {
  constructor(
    meetingId: string,
    currentStatus: string,
    requiredStatus: string,
  ) {
    super(
      `会议状态不符合要求: ${meetingId}, 当前状态: ${currentStatus}, 要求状态: ${requiredStatus}`,
      HttpStatus.CONFLICT,
    );
  }
}
