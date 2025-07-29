import { ApiOperation, ApiResponse, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

/**
 * 腾讯会议Webhook相关装饰器
 */
export const TencentWebhookDecorators = {
    // URL验证装饰器
    urlVerification: {
        operation: ApiOperation({
            summary: '腾讯会议Webhook URL验证',
            description: '用于腾讯会议webhook URL有效性验证'
        }),
        queries: [
            ApiQuery({
                name: 'check_str',
                description: '验证字符串',
                required: true
            }),
            ApiQuery({
                name: 'timestamp',
                description: '时间戳',
                required: true
            }),
            ApiQuery({
                name: 'nonce',
                description: '随机数',
                required: true
            }),
            ApiQuery({
                name: 'signature',
                description: '签名',
                required: true
            })
        ],
        responses: [
            ApiResponse({
                status: 200,
                description: '验证成功，返回解密后的明文'
            }),
            ApiResponse({
                status: 400,
                description: '缺少必要参数'
            }),
            ApiResponse({
                status: 403,
                description: '签名验证失败'
            })
        ]
    },

    // 事件接收装饰器
    eventReceiver: {
        operation: ApiOperation({
            summary: '腾讯会议Webhook事件接收',
            description: '接收腾讯会议的Webhook事件通知'
        }),
        headers: [
            ApiHeader({
                name: 'Wechatwork-Signature',
                description: '腾讯会议签名',
                required: true
            })
        ],
        queries: [
            ApiQuery({
                name: 'msg_signature',
                description: '消息签名（URL验证时使用）',
                required: false
            }),
            ApiQuery({
                name: 'timestamp',
                description: '时间戳',
                required: false
            }),
            ApiQuery({
                name: 'nonce',
                description: '随机数',
                required: false
            }),
            ApiQuery({
                name: 'echostr',
                description: '验证字符串（URL验证时使用）',
                required: false
            })
        ],
        responses: [
            ApiResponse({
                status: 200,
                description: 'Webhook处理成功'
            }),
            ApiResponse({
                status: 400,
                description: '请求参数错误'
            }),
            ApiResponse({
                status: 401,
                description: '签名验证失败'
            })
        ]
    }
};

/**
 * 通用Webhook装饰器
 */
export const CommonWebhookDecorators = {
    healthCheck: {
        operation: ApiOperation({
            summary: 'Webhook健康检查',
            description: '检查Webhook服务的健康状态'
        }),
        responses: [
            ApiResponse({
                status: 200,
                description: '服务健康',
                schema: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        timestamp: { type: 'string' },
                        supportedEvents: { type: 'number' }
                    }
                }
            })
        ]
    },

    supportedEvents: {
        operation: ApiOperation({
            summary: '获取支持的事件',
            description: '获取当前支持的所有Webhook事件类型'
        }),
        responses: [
            ApiResponse({
                status: 200,
                description: '支持的事件列表',
                schema: {
                    type: 'object',
                    properties: {
                        events: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        stats: {
                            type: 'object',
                            properties: {
                                totalHandlers: { type: 'number' },
                                supportedPlatforms: {
                                    type: 'array',
                                    items: { type: 'string' }
                                },
                                supportedEvents: {
                                    type: 'array',
                                    items: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            })
        ]
    }
};

/**
 * 装饰器应用辅助函数
 */
export function applyDecorators(decoratorConfig: any) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        // 应用操作装饰器
        if (decoratorConfig.operation) {
            decoratorConfig.operation(target, propertyKey, descriptor);
        }

        // 应用查询参数装饰器
        if (decoratorConfig.queries) {
            decoratorConfig.queries.forEach((query: any) => {
                query(target, propertyKey, descriptor);
            });
        }

        // 应用响应装饰器
        if (decoratorConfig.responses) {
            decoratorConfig.responses.forEach((response: any) => {
                response(target, propertyKey, descriptor);
            });
        }

        // 应用头部装饰器
        if (decoratorConfig.headers) {
            decoratorConfig.headers.forEach((header: any) => {
                header(target, propertyKey, descriptor);
            });
        }
    };
}