import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    Logger,
    ParseUUIDPipe,
    ValidationPipe
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
    ApiBearerAuth,
    ApiBody
} from '@nestjs/swagger';
import { MeetingRecordDecorators, applyDecorators } from '../../common/decorators/api-decorators';
import { MeetingService } from '../services/meeting.service';
import {
    QueryMeetingRecordsDto,
    MeetingRecordResponseDto,
    MeetingRecordListResponseDto
} from '../dto/common/meeting-record.dto';
import { CreateMeetingRecordDto } from '../dto/common/create-meeting-record.dto';
import { UpdateMeetingRecordDto } from '../dto/common/update-meeting-record.dto';

/**
 * 会议记录控制器
 * 提供会议记录的CRUD操作API
 */
@ApiTags('Meet')
@Controller('meetings')
@ApiBearerAuth()
export class MeetingController {
    private readonly logger = new Logger(MeetingController.name);

    constructor(private readonly meetingService: MeetingService) { }

    /**
     * 获取会议记录列表
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @applyDecorators(MeetingRecordDecorators.getMeetingRecords)
    async getMeetingRecords(
        @Query(new ValidationPipe({ transform: true })) query: QueryMeetingRecordsDto
    ): Promise<MeetingRecordListResponseDto> {
        this.logger.log('获取会议记录列表', { query });

        try {
            const queryParams = {
                ...query,
                startDate: query.startDate ? new Date(query.startDate) : undefined,
                endDate: query.endDate ? new Date(query.endDate) : undefined
            };
            const result = await this.meetingService.getMeetingRecords(queryParams);

            this.logger.log(`获取会议记录成功，共 ${result.total} 条记录`);
            return {
                data: result.records,
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: Math.ceil(result.total / result.limit)
            };
        } catch (error) {
            this.logger.error('获取会议记录失败', error.stack);
            throw error;
        }
    }

    /**
     * 根据ID获取会议记录详情
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '获取会议记录详情',
        description: '根据会议记录ID获取详细信息，包括文件列表和参会者信息'
    })
    @ApiParam({
        name: 'id',
        description: '会议记录ID',
        type: 'string',
        format: 'uuid'
    })
    @ApiResponse({
        status: 200,
        description: '获取成功',
        type: MeetingRecordResponseDto
    })
    @ApiResponse({
        status: 404,
        description: '会议记录不存在'
    })
    async getMeetingRecordById(
        @Param('id', ParseUUIDPipe) id: string
    ): Promise<MeetingRecordResponseDto> {
        this.logger.log(`获取会议记录详情: ${id}`);

        try {
            const record = await this.meetingService.getMeetingRecordById(id);

            this.logger.log(`获取会议记录详情成功: ${record.id}`);
            return record;
        } catch (error) {
            this.logger.error(`获取会议记录详情失败: ${id}`, error.stack);
            throw error;
        }
    }

    /**
     * 创建会议记录
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: '创建会议记录',
        description: '手动创建会议记录'
    })
    @ApiBody({
        description: '会议记录创建参数',
        type: CreateMeetingRecordDto
    })
    @ApiResponse({
        status: 201,
        description: '创建成功',
        type: MeetingRecordResponseDto
    })
    @ApiResponse({
        status: 400,
        description: '请求参数错误'
    })
    @ApiResponse({
        status: 409,
        description: '会议记录已存在'
    })
    async createMeetingRecord(
        @Body(new ValidationPipe()) createParams: CreateMeetingRecordDto
    ): Promise<MeetingRecordResponseDto> {
        this.logger.log('创建会议记录', { meetingId: createParams.platformMeetingId });

        try {
            const record = await this.meetingService.createMeetingRecord(createParams);

            this.logger.log(`创建会议记录成功: ${record.id}`);
            return record;
        } catch (error) {
            this.logger.error('创建会议记录失败', error.stack);
            throw error;
        }
    }

    /**
     * 更新会议记录
     */
    @Put(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '更新会议记录',
        description: '更新会议记录信息'
    })
    @ApiParam({
        name: 'id',
        description: '会议记录ID',
        type: 'string',
        format: 'uuid'
    })
    @ApiBody({
        description: '会议记录更新参数',
        type: UpdateMeetingRecordDto
    })
    @ApiResponse({
        status: 200,
        description: '更新成功',
        type: MeetingRecordResponseDto
    })
    @ApiResponse({
        status: 404,
        description: '会议记录不存在'
    })
    async updateMeetingRecord(
        @Param('id', ParseUUIDPipe) id: string,
        @Body(new ValidationPipe()) updateParams: UpdateMeetingRecordDto
    ): Promise<MeetingRecordResponseDto> {
        this.logger.log(`更新会议记录: ${id}`, updateParams);

        try {
            const record = await this.meetingService.updateMeetingRecord(id, updateParams);

            this.logger.log(`更新会议记录成功: ${record.id}`);
            return record;
        } catch (error) {
            this.logger.error(`更新会议记录失败: ${id}`, error.stack);
            throw error;
        }
    }

    /**
     * 删除会议记录
     */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: '删除会议记录',
        description: '删除指定的会议记录及其关联的文件'
    })
    @ApiParam({
        name: 'id',
        description: '会议记录ID',
        type: 'string',
        format: 'uuid'
    })
    @ApiResponse({
        status: 204,
        description: '删除成功'
    })
    @ApiResponse({
        status: 404,
        description: '会议记录不存在'
    })
    async deleteMeetingRecord(
        @Param('id', ParseUUIDPipe) id: string
    ): Promise<void> {
        this.logger.log(`删除会议记录: ${id}`);

        try {
            await this.meetingService.deleteMeetingRecord(id);

            this.logger.log(`删除会议记录成功: ${id}`);
        } catch (error) {
            this.logger.error(`删除会议记录失败: ${id}`, error.stack);
            throw error;
        }
    }

    /**
     * 获取会议统计信息
     */
    @Get('stats/summary')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '获取会议统计信息',
        description: '获取会议记录的统计信息，包括总数、各平台分布、状态分布等'
    })
    @ApiQuery({
        name: 'startDate',
        type: String,
        required: false,
        description: '统计开始日期 (YYYY-MM-DD)'
    })
    @ApiQuery({
        name: 'endDate',
        type: String,
        required: false,
        description: '统计结束日期 (YYYY-MM-DD)'
    })
    @ApiResponse({
        status: 200,
        description: '获取成功',
        schema: {
            type: 'object',
            properties: {
                total: { type: 'number', description: '总会议数' },
                platformStats: {
                    type: 'object',
                    description: '各平台会议数统计'
                },
                statusStats: {
                    type: 'object',
                    description: '各状态会议数统计'
                },
                typeStats: {
                    type: 'object',
                    description: '各类型会议数统计'
                },
                recentMeetings: {
                    type: 'array',
                    description: '最近的会议记录'
                }
            }
        }
    })
    async getMeetingStats(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ): Promise<any> {
        this.logger.log('获取会议统计信息', { startDate, endDate });

        try {
            const stats = await this.meetingService.getMeetingStats({
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined
            });

            this.logger.log('获取会议统计信息成功');
            return stats;
        } catch (error) {
            this.logger.error('获取会议统计信息失败', error.stack);
            throw error;
        }
    }

    /**
     * 重新处理会议录制文件
     */
    @Post(':id/reprocess')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '重新处理会议录制文件',
        description: '重新处理指定会议的录制文件，重新生成AI摘要和转录等'
    })
    @ApiParam({
        name: 'id',
        description: '会议记录ID',
        type: 'string',
        format: 'uuid'
    })
    @ApiResponse({
        status: 200,
        description: '重新处理成功',
        type: MeetingRecordResponseDto
    })
    @ApiResponse({
        status: 404,
        description: '会议记录不存在'
    })
    async reprocessMeetingRecord(
        @Param('id', ParseUUIDPipe) id: string
    ): Promise<MeetingRecordResponseDto> {
        this.logger.log(`重新处理会议录制文件: ${id}`);

        try {
            const record = await this.meetingService.reprocessMeetingRecord(id);

            this.logger.log(`重新处理会议录制文件成功: ${record.id}`);
            return record;
        } catch (error) {
            this.logger.error(`重新处理会议录制文件失败: ${id}`, error.stack);
            throw error;
        }
    }

    /**
     * 健康检查端点
     */
    @Get('health')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '健康检查',
        description: '检查会议服务的运行状态'
    })
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
    async healthCheck() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'meeting-service'
        };
    }
}