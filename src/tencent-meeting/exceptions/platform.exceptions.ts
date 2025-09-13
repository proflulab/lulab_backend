import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 会议相关异常基类（Tencent 模块本地定义）
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
