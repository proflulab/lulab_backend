import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiHeader,
  ApiResponse,
} from '@nestjs/swagger';

/**
 * 腾讯会议Webhook URL验证装饰器
 * 用于腾讯会议webhook URL有效性验证
 */
export function ApiTencentUrlVerificationDocs() {
  return applyDecorators(
    ApiOperation({
      summary: '腾讯会议Webhook URL验证',
      description: '用于腾讯会议webhook URL有效性验证，参数通过Header传递',
      tags: ['Tencent Meeting'],
    }),
    ApiQuery({
      name: 'check_str',
      description: '验证字符串（Base64编码，URL参数）',
      required: true,
      example: 'check_str',
    }),
    ApiHeader({
      name: 'timestamp',
      description: '时间戳（Header参数）',
      required: true,
    }),
    ApiHeader({
      name: 'nonce',
      description: '随机数（Header参数）',
      required: true,
    }),
    ApiHeader({
      name: 'signature',
      description: '签名（Header参数）',
      required: true,
    }),
    ApiResponse({
      status: 200,
      description: '验证成功，返回解密后的明文',
    }),
    ApiResponse({
      status: 400,
      description: '缺少必要参数',
    }),
    ApiResponse({
      status: 403,
      description: '签名验证失败',
    })
  );
}

/**
 * 腾讯会议Webhook事件接收装饰器
 * 接收腾讯会议的Webhook事件通知
 */
export function ApiTencentEventReceiverDocs() {
  return applyDecorators(
    ApiOperation({
      summary: '腾讯会议Webhook事件接收',
      description: '接收腾讯会议的Webhook事件通知',
      tags: ['Tencent Meeting'],
    }),
    ApiHeader({
      name: 'Wechatwork-Signature',
      description: '腾讯会议签名',
      required: true,
    }),
    ApiQuery({
      name: 'msg_signature',
      description: '消息签名（URL验证时使用）',
      required: false,
    }),
    ApiQuery({
      name: 'timestamp',
      description: '时间戳',
      required: false,
    }),
    ApiQuery({
      name: 'nonce',
      description: '随机数',
      required: false,
    }),
    ApiQuery({
      name: 'echostr',
      description: '验证字符串（URL验证时使用）',
      required: false,
    }),
    ApiResponse({
      status: 200,
      description: 'Webhook处理成功',
    }),
    ApiResponse({
      status: 400,
      description: '请求参数错误',
    }),
    ApiResponse({
      status: 401,
      description: '签名验证失败',
    })
  );
}