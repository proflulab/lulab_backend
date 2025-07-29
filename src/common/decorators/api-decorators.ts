import { ApiOperation, ApiResponse, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';
import { MeetingPlatform, MeetingType, ProcessingStatus } from '@prisma/client';
import { MeetingRecordListResponseDto } from '../../meeting/dto/common/meeting-record.dto';

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
                status: HttpStatus.OK,
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
                status: HttpStatus.OK,
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
 * 会议记录相关装饰器
 */
export const MeetingRecordDecorators = {
    // 获取会议记录列表装饰器
    getMeetingRecords: {
        operation: ApiOperation({
            summary: '获取会议记录列表',
            description: '根据查询条件获取会议记录列表，支持分页、筛选和排序'
        }),
        queries: [
            ApiQuery({
                name: 'platform',
                enum: MeetingPlatform,
                required: false,
                description: '会议平台'
            }),
            ApiQuery({
                name: 'status',
                enum: ProcessingStatus,
                required: false,
                description: '会议状态'
            }),
            ApiQuery({
                name: 'type',
                enum: MeetingType,
                required: false,
                description: '会议类型'
            }),
            ApiQuery({
                name: 'startDate',
                type: String,
                required: false,
                description: '开始日期 (YYYY-MM-DD)'
            }),
            ApiQuery({
                name: 'endDate',
                type: String,
                required: false,
                description: '结束日期 (YYYY-MM-DD)'
            }),
            ApiQuery({
                name: 'page',
                type: Number,
                required: false,
                description: '页码，从1开始'
            }),
            ApiQuery({
                name: 'limit',
                type: Number,
                required: false,
                description: '每页数量'
            }),
            ApiQuery({
                name: 'search',
                type: String,
                required: false,
                description: '搜索关键词（会议主题、主持人等）'
            })
        ],
        responses: [
            ApiResponse({
                status: 200,
                description: '获取成功',
                type: MeetingRecordListResponseDto
            }),
            ApiResponse({
                status: 400,
                description: '请求参数错误'
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