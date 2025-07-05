import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    Param,
    Headers,
    HttpException,
    HttpStatus,
    Logger
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiHeader, ApiBody } from '@nestjs/swagger';
import { MeetingService } from './meeting.service';
import { verifySignature, aesDecrypt } from '../utils/tencent-meeting/crypto';
import { TencentMeetingEvent } from '../utils/tencent-meeting/types';
import { MeetingPlatform } from '@prisma/client';

@ApiTags('会议管理')
@Controller('meeting')
export class MeetingController {
    private readonly logger = new Logger(MeetingController.name);

    constructor(
        private meetingService: MeetingService,
        private configService: ConfigService
    ) { }

    /**
     * 腾讯会议webhook验证端点 (GET)
     * 用于URL有效性验证
     */
    @ApiOperation({ summary: '腾讯会议webhook验证', description: '用于腾讯会议webhook URL有效性验证' })
    @ApiQuery({ name: 'check_str', description: '验证字符串', required: true })
    @ApiHeader({ name: 'timestamp', description: '时间戳', required: true })
    @ApiHeader({ name: 'nonce', description: '随机数', required: true })
    @ApiHeader({ name: 'signature', description: '签名', required: true })
    @ApiResponse({ status: 200, description: '验证成功，返回解密后的明文' })
    @ApiResponse({ status: 400, description: '缺少必要参数' })
    @ApiResponse({ status: 403, description: '签名验证失败' })
    @ApiResponse({ status: 500, description: '服务器内部错误' })
    @Get('tencent/webhook')
    async verifyTencentWebhook(
        @Query('check_str') checkStr: string,
        @Headers('timestamp') timestamp: string,
        @Headers('nonce') nonce: string,
        @Headers('signature') signature: string
    ): Promise<string> {
        try {
            // 1. 参数校验
            if (!checkStr || !timestamp || !nonce || !signature) {
                throw new HttpException('Missing required parameters', HttpStatus.BAD_REQUEST);
            }

            const token = this.configService.get<string>('TENCENT_MEETING_TOKEN');
            const encodingAesKey = this.configService.get<string>('TENCENT_MEETING_ENCODING_AES_KEY');

            if (!token || !encodingAesKey) {
                throw new HttpException('Missing configuration', HttpStatus.INTERNAL_SERVER_ERROR);
            }

            // 2. 签名验证
            const isValid = verifySignature(
                token,
                timestamp,
                nonce,
                decodeURIComponent(checkStr),
                signature
            );

            if (!isValid) {
                throw new HttpException('Invalid signature', HttpStatus.FORBIDDEN);
            }

            // 3. 解密check_str
            this.logger.log('开始解密check_str');
            const decryptedStr = await aesDecrypt(decodeURIComponent(checkStr), encodingAesKey);
            this.logger.log('解密成功');

            // 4. 返回解密后的明文
            return decryptedStr;
        } catch (error) {
            this.logger.error('腾讯会议webhook验证失败:', error);
            throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 腾讯会议webhook事件接收端点 (POST)
     * 用于接收事件消息
     */
    @ApiOperation({ summary: '腾讯会议webhook事件接收', description: '接收腾讯会议的事件回调消息' })
    @ApiHeader({ name: 'timestamp', description: '时间戳', required: true })
    @ApiHeader({ name: 'nonce', description: '随机数', required: true })
    @ApiHeader({ name: 'signature', description: '签名', required: true })
    @ApiBody({
        description: '加密的事件数据',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'string',
                    description: '加密的事件数据'
                }
            },
            required: ['data']
        }
    })
    @ApiResponse({ status: 200, description: '事件处理成功' })
    @ApiResponse({ status: 400, description: '缺少必要参数或数据' })
    @ApiResponse({ status: 403, description: '签名验证失败' })
    @ApiResponse({ status: 500, description: '服务器内部错误' })
    @Post('tencent/webhook')
    async handleTencentWebhook(
        @Body() body: { data: string },
        @Headers('timestamp') timestamp: string,
        @Headers('nonce') nonce: string,
        @Headers('signature') signature: string
    ): Promise<string> {
        try {
            // 1. 参数校验
            if (!timestamp || !nonce || !signature) {
                throw new HttpException('Missing required parameters', HttpStatus.BAD_REQUEST);
            }

            if (!body.data) {
                throw new HttpException('Missing data in request body', HttpStatus.BAD_REQUEST);
            }

            const token = this.configService.get<string>('TENCENT_MEETING_TOKEN');
            const encodingAesKey = this.configService.get<string>('TENCENT_MEETING_ENCODING_AES_KEY');

            if (!token || !encodingAesKey) {
                throw new HttpException('Missing configuration', HttpStatus.INTERNAL_SERVER_ERROR);
            }

            // 2. 签名验证
            const isValid = verifySignature(
                token,
                timestamp,
                nonce,
                body.data,
                signature
            );

            if (!isValid) {
                throw new HttpException('Invalid signature', HttpStatus.FORBIDDEN);
            }

            // 3. 解密数据
            const decryptedData = await aesDecrypt(body.data, encodingAesKey);

            // 4. 处理解密后的数据
            const eventData: TencentMeetingEvent = JSON.parse(decryptedData);
            this.logger.log(`收到事件: ${eventData.event}`);

            // 5. 处理不同类型的事件
            switch (eventData.event) {
                case 'recording.completed':
                    // 异步处理录制完成事件，避免阻塞响应
                    this.meetingService.handleRecordingCompleted(eventData)
                        .catch(error => {
                            this.logger.error('处理录制完成事件失败:', error);
                        });
                    break;
                default:
                    this.logger.log(`未处理的事件类型: ${eventData.event}`);
                    break;
            }

            // 6. 返回成功响应
            return 'successfully received callback';
        } catch (error) {
            this.logger.error('处理腾讯会议webhook失败:', error);
            throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 获取会议记录列表
     */
    @ApiOperation({ summary: '获取会议记录列表', description: '根据条件查询会议记录列表' })
    @ApiQuery({ name: 'platform', description: '会议平台', required: false, enum: ['TENCENT_MEETING', 'ZOOM', 'OTHER'] })
    @ApiQuery({ name: 'startDate', description: '开始日期 (YYYY-MM-DD)', required: false })
    @ApiQuery({ name: 'endDate', description: '结束日期 (YYYY-MM-DD)', required: false })
    @ApiQuery({ name: 'page', description: '页码', required: false, type: 'number' })
    @ApiQuery({ name: 'limit', description: '每页数量', required: false, type: 'number' })
    @ApiResponse({ status: 200, description: '成功获取会议记录列表' })
    @Get('records')
    async getMeetingRecords(
        @Query('platform') platform?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string
    ) {
        const params: any = {};

        if (platform) {
            params.platform = platform as MeetingPlatform;
        }
        if (startDate) {
            params.startDate = new Date(startDate);
        }
        if (endDate) {
            params.endDate = new Date(endDate);
        }
        if (page) {
            params.page = parseInt(page, 10);
        }
        if (limit) {
            params.limit = parseInt(limit, 10);
        }

        return this.meetingService.getMeetingRecords(params);
    }

    /**
     * 获取会议记录详情
     */
    @ApiOperation({ summary: '获取会议记录详情', description: '根据ID获取特定会议记录的详细信息' })
    @ApiParam({ name: 'id', description: '会议记录ID', required: true })
    @ApiResponse({ status: 200, description: '成功获取会议记录详情' })
    @ApiResponse({ status: 404, description: '会议记录不存在' })
    @Get('records/:id')
    async getMeetingRecordById(@Param('id') id: string) {
        const record = await this.meetingService.getMeetingRecordById(id);
        if (!record) {
            throw new HttpException('Meeting record not found', HttpStatus.NOT_FOUND);
        }
        return record;
    }

    /**
     * 健康检查端点
     */
    @ApiOperation({ summary: '健康检查', description: '检查会议服务的运行状态' })
    @ApiResponse({
        status: 200,
        description: '服务正常运行',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string', example: 'ok' },
                timestamp: { type: 'string', example: '2023-12-01T10:00:00.000Z' },
                service: { type: 'string', example: 'meeting-service' }
            }
        }
    })
    @Get('health')
    async healthCheck() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'meeting-service'
        };
    }
}