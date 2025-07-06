import {
    Controller,
    Get,
    Query,
    Param,
    HttpException,
    HttpStatus,
    Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { MeetingService } from '../meeting.service';
import { MeetingPlatform } from '@prisma/client';

@ApiTags('会议管理')
@Controller('meeting')
export class MeetingController {
    private readonly logger = new Logger(MeetingController.name);

    constructor(
        private meetingService: MeetingService
    ) { }

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