import { Injectable, Logger } from '@nestjs/common';
import Dysmsapi20170525, * as $Dysmsapi20170525 from '@alicloud/dysmsapi20170525';
import * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';
import Credential from '@alicloud/credentials';
import { CodeType } from '../../dto/auth.dto';

@Injectable()
export class AliyunSmsService {
  private readonly logger = new Logger(AliyunSmsService.name);
  private client: Dysmsapi20170525;

  constructor() {
    this.client = this.createClient();
  }

  /**
   * 创建阿里云短信客户端
   */
  private createClient(): Dysmsapi20170525 {
    // 工程代码建议使用更安全的无AK方式，凭据配置方式请参见：https://help.aliyun.com/document_detail/378664.html
    const credential = new Credential();
    const config = new $OpenApi.Config({
      credential: credential,
    });
    // Endpoint 请参考 https://api.aliyun.com/product/Dysmsapi
    config.endpoint = 'dysmsapi.aliyuncs.com';
    return new Dysmsapi20170525(config);
  }

  /**
   * 发送短信验证码
   * @param phoneNumber 手机号码
   * @param code 验证码
   * @param type 验证码类型
   * @param countryCode 国家代码（可选）
   */
  async sendSms(
    phoneNumber: string,
    code: string,
    type: CodeType,
    countryCode?: string,
  ): Promise<void> {
    try {
      // 根据验证码类型选择模板
      const templateCode = this.getTemplateCode(type);
      const signName = this.getSignName();

      // 构建完整的手机号（包含国家代码）
      const fullPhoneNumber = countryCode
        ? `${countryCode}${phoneNumber}`
        : phoneNumber;

      const sendSmsRequest = new $Dysmsapi20170525.SendSmsRequest({
        phoneNumbers: fullPhoneNumber,
        signName: signName,
        templateCode: templateCode,
        templateParam: JSON.stringify({ code: code }),
      });

      const runtime = new $Util.RuntimeOptions({});

      const response = await this.client.sendSmsWithOptions(
        sendSmsRequest,
        runtime,
      );

      this.logger.log(`短信发送成功: ${fullPhoneNumber}, 验证码: ${code}`);

      // 检查响应状态
      if (response.body?.code !== 'OK') {
        const message = response.body?.message ?? '未知错误';
        throw new Error(`短信发送失败: ${message}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`短信发送失败: ${errorMessage}`);

      const typedError = error as Record<string, unknown>;
      if (typedError?.data && typeof typedError.data === 'object') {
        const data = typedError.data as Record<string, unknown>;
        if (data?.Recommend) {
          const recommend = data.Recommend as unknown;
          const recommendStr =
            typeof recommend === 'string'
              ? recommend
              : JSON.stringify(recommend);
          this.logger.error(`诊断地址: ${recommendStr}`);
        }
      }
      throw new Error(`短信发送失败: ${errorMessage}`);
    }
  }

  /**
   * 根据验证码类型获取短信模板代码
   * 注意：这些模板代码需要在阿里云控制台中预先配置
   */
  private getTemplateCode(type: CodeType): string {
    const templateMap = {
      [CodeType.REGISTER]:
        process.env.ALIYUN_SMS_TEMPLATE_REGISTER || 'SMS_271525576',
      [CodeType.LOGIN]:
        process.env.ALIYUN_SMS_TEMPLATE_LOGIN || 'SMS_271525576',
      [CodeType.RESET_PASSWORD]:
        process.env.ALIYUN_SMS_TEMPLATE_RESET || 'SMS_271525576',
    };

    return templateMap[type];
  }

  /**
   * 获取短信签名
   * 注意：签名需要在阿里云控制台中预先配置并审核通过
   */
  private getSignName(): string {
    return process.env.ALIYUN_SMS_SIGN_NAME || '视算新里程科技';
  }
}
