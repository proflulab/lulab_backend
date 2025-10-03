/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-10-03 06:04:16
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-10-03 14:22:01
 * @FilePath: /lulab_backend/src/task/tasks.controller.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

// src/tasks/tasks.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiExtraModels,
  getSchemaPath,
  ApiProperty,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateOnceDto } from './dtos/create-once.dto';
import { CreateCronDto } from './dtos/create-cron.dto';
import { UpdateTaskDto } from './dtos/update-task.dto';
import { QueryDto } from './dtos/query.dto';
import { TaskStatus, TaskType } from '@prisma/client';

// ---- Swagger View Models（仅用于文档展示，不影响业务类型）----
class OkResponse {
  @ApiProperty({ description: '操作成功标识', example: true })
  ok!: true;
}

class RunNowResponse {
  @ApiProperty({ 
    description: 'BullMQ任务ID，v5版本可能为null', 
    type: 'string',
    nullable: true,
    example: 'job_123456'
  })
  jobId!: string | number | null; // BullMQ v5: 兜底为 null
}

class TaskEntity {
  @ApiProperty({ description: '任务唯一标识', example: 'clx9abc123def456' })
  id!: string;
  
  @ApiProperty({ description: '任务名称', example: '数据同步任务' })
  name!: string;
  
  @ApiProperty({ 
    description: '任务类型', 
    enum: TaskType, 
    example: TaskType.ONCE 
  })
  type!: TaskType;
  
  @ApiProperty({ description: '队列名称', example: 'tasks' })
  queueName!: string;
  
  @ApiProperty({ 
    description: 'BullMQ任务ID，可能为null', 
    type: 'string',
    nullable: true,
    example: 'job_123456'
  })
  jobId!: string | null;
  
  @ApiProperty({ 
    description: '重复任务键值，Cron任务特有', 
    type: 'string',
    nullable: true,
    example: '__default__::cron::data-sync::0 0 2 * * *'
  })
  repeatKey!: string | null;
  
  @ApiProperty({ 
    description: 'Cron表达式，仅Cron任务有值', 
    type: 'string',
    nullable: true,
    example: '0 0 2 * * *'
  })
  cron!: string | null;
  
  @ApiProperty({ 
    description: '执行时间，仅一次性任务有值', 
    type: 'string',
    format: 'date-time',
    nullable: true,
    example: '2025-10-15T14:30:00.000Z'
  })
  runAt!: Date | null;
  
  @ApiProperty({ 
    description: '任务负载数据，JSON格式', 
    type: 'object',
    additionalProperties: true,
    example: { userId: 123, action: 'sync_data' }
  })
  payload!: Record<string, unknown>;
  
  @ApiProperty({ 
    description: '任务状态', 
    enum: TaskStatus, 
    example: TaskStatus.SCHEDULED 
  })
  status!: TaskStatus;
  
  @ApiProperty({ 
    description: '最后一次错误信息', 
    type: 'string',
    nullable: true,
    example: '数据库连接超时'
  })
  lastError!: string | null;
  
  @ApiProperty({ 
    description: '创建时间', 
    type: 'string',
    format: 'date-time',
    example: '2025-10-01T08:00:00.000Z'
  })
  createdAt!: Date;
  
  @ApiProperty({ 
    description: '更新时间', 
    type: 'string',
    format: 'date-time',
    example: '2025-10-01T08:00:00.000Z'
  })
  updatedAt!: Date;
}

class PaginatedTasksResponse {
  @ApiProperty({ 
    description: '任务列表', 
    type: [TaskEntity] 
  })
  items!: TaskEntity[];
  
  @ApiProperty({ 
    description: '总记录数', 
    example: 100 
  })
  total!: number;
  
  @ApiProperty({ 
    description: '当前页码', 
    example: 1 
  })
  page!: number;
  
  @ApiProperty({ 
    description: '每页记录数', 
    example: 20 
  })
  pageSize!: number;
}

@ApiTags('Tasks')
@ApiExtraModels(TaskEntity, PaginatedTasksResponse, OkResponse, RunNowResponse)
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly service: TasksService) {}

  // 健康检查端点（可选）
  @ApiOperation({ 
    summary: '任务服务健康检查',
    description: '检查任务服务是否正常运行'
  })
  @ApiOkResponse({ 
    description: '服务正常运行',
    schema: {
      type: 'object',
      additionalProperties: true,
      example: { status: 'ok', timestamp: '2025-10-01T08:00:00.000Z' }
    }
  })
  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  }

  @ApiOperation({ 
    summary: '创建一次性任务（在指定时间点执行）',
    description: '创建一个在指定时间点执行的一次性任务，任务将在指定的ISO 8601时间自动执行'
  })
  @ApiCreatedResponse({ 
    type: TaskEntity, 
    description: '已创建的一次性任务',
    schema: {
      type: 'object',
      additionalProperties: true,
      example: {
        id: 'clx9abc123def456',
        name: '数据同步任务',
        type: 'ONCE',
        queueName: 'tasks',
        jobId: 'job_123456',
        repeatKey: null,
        cron: null,
        runAt: '2025-10-15T14:30:00.000Z',
        payload: { userId: 123, action: 'sync_data' },
        status: 'SCHEDULED',
        lastError: null,
        createdAt: '2025-10-01T08:00:00.000Z',
        updatedAt: '2025-10-01T08:00:00.000Z'
      }
    }
  })
  @ApiBody({ 
    type: CreateOnceDto,
    description: '一次性任务创建参数',
    schema: {
      type: 'object',
      additionalProperties: true,
      example: {
        name: '数据同步任务',
        runAt: '2025-10-15T14:30:00.000Z',
        payload: { userId: 123, action: 'sync_data' },
        jobIdHint: 'custom-job-id'
      }
    }
  })
  @Post('once')
  createOnce(@Body() dto: CreateOnceDto) {
    return this.service.createOnce(dto);
  }

  @ApiOperation({ 
    summary: '创建 Cron 任务（pattern/cron 周期执行）',
    description: '创建一个按照Cron表达式周期性执行的任务，使用上海时区(Asia/Shanghai)'
  })
  @ApiCreatedResponse({ 
    type: TaskEntity, 
    description: '已创建的周期任务',
    schema: {
      type: 'object',
      additionalProperties: true,
      example: {
        id: 'clx9abc123def457',
        name: '每日数据备份',
        type: 'CRON',
        queueName: 'tasks',
        jobId: 'job_789012',
        repeatKey: '__default__::cron::daily-backup::0 0 2 * * *',
        cron: '0 0 2 * * *',
        runAt: null,
        payload: { backupType: 'full', retentionDays: 30 },
        status: 'SCHEDULED',
        lastError: null,
        createdAt: '2025-10-01T08:00:00.000Z',
        updatedAt: '2025-10-01T08:00:00.000Z'
      }
    }
  })
  @ApiBody({ 
    type: CreateCronDto,
    description: 'Cron任务创建参数',
    schema: {
      type: 'object',
      additionalProperties: true,
      example: {
        name: '每日数据备份',
        cron: '0 0 2 * * *',
        payload: { backupType: 'full', retentionDays: 30 }
      }
    }
  })
  @Post('cron')
  createCron(@Body() dto: CreateCronDto) {
    return this.service.createCron(dto);
  }

  @ApiOperation({ 
    summary: '任务列表（分页/搜索/排序）',
    description: '获取任务列表，支持分页、搜索、状态筛选、类型筛选和排序功能'
  })
  @ApiOkResponse({
    description: '任务列表分页数据',
    schema: {
      type: 'object',
      additionalProperties: true,
      allOf: [{ $ref: getSchemaPath(PaginatedTasksResponse) }],
      example: {
        items: [
          {
            id: 'clx9abc123def456',
            name: '数据同步任务',
            type: 'ONCE',
            queueName: 'tasks',
            jobId: 'job_123456',
            repeatKey: null,
            cron: null,
            runAt: '2025-10-15T14:30:00.000Z',
            payload: { userId: 123, action: 'sync_data' },
            status: 'SCHEDULED',
            lastError: null,
            createdAt: '2025-10-01T08:00:00.000Z',
            updatedAt: '2025-10-01T08:00:00.000Z'
          }
        ],
        total: 25,
        page: 1,
        pageSize: 20
      }
    },
  })
  @ApiQuery({ 
    name: 'search', 
    required: false, 
    description: '按名称模糊搜索',
    example: '数据同步'
  })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    enum: TaskStatus,
    description: '任务状态筛选',
    example: 'SCHEDULED'
  })
  @ApiQuery({ 
    name: 'type', 
    required: false, 
    enum: TaskType,
    description: '任务类型筛选',
    example: 'ONCE'
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number,
    description: '页码，默认为1',
    example: 1
  })
  @ApiQuery({ 
    name: 'pageSize', 
    required: false, 
    type: Number,
    description: '每页记录数，默认为20',
    example: 20
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    enum: ['createdAt', 'updatedAt'],
    description: '排序字段，默认为createdAt',
    example: 'createdAt'
  })
  @ApiQuery({ 
    name: 'orderDir', 
    required: false, 
    enum: ['asc', 'desc'],
    description: '排序方向，默认为desc',
    example: 'desc'
  })
  @Get()
  list(@Query() q: QueryDto) {
    return this.service.list(q);
  }

  @ApiOperation({ 
    summary: '任务详情',
    description: '根据任务ID获取单个任务的详细信息'
  })
  @ApiOkResponse({ 
    type: TaskEntity,
    description: '任务详细信息',
    schema: {
      type: 'object',
      additionalProperties: true,
      example: {
        id: 'clx9abc123def456',
        name: '数据同步任务',
        type: 'ONCE',
        queueName: 'tasks',
        jobId: 'job_123456',
        repeatKey: null,
        cron: null,
        runAt: '2025-10-15T14:30:00.000Z',
        payload: { userId: 123, action: 'sync_data' },
        status: 'SCHEDULED',
        lastError: null,
        createdAt: '2025-10-01T08:00:00.000Z',
        updatedAt: '2025-10-01T08:00:00.000Z'
      }
    }
  })
  @ApiParam({ 
    name: 'id', 
    description: '任务 ID',
    type: 'string',
    example: 'clx9abc123def456'
  })
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.service.detail(id);
  }

  @ApiOperation({ 
    summary: '更新任务（可改名/cron/payload/status）',
    description: '更新任务的名称、Cron表达式、负载数据或状态。注意：修改Cron表达式会重新创建BullMQ任务'
  })
  @ApiOkResponse({ 
    type: TaskEntity,
    description: '更新后的任务信息',
    schema: {
      type: 'object',
      additionalProperties: true,
      example: {
        id: 'clx9abc123def456',
        name: '更新的任务名称',
        type: 'CRON',
        queueName: 'tasks',
        jobId: 'job_123456',
        repeatKey: '__default__::cron::updated-task::0 0 3 * * *',
        cron: '0 0 3 * * *',
        runAt: null,
        payload: { userId: 456, action: 'updated_action' },
        status: 'SCHEDULED',
        lastError: null,
        createdAt: '2025-10-01T08:00:00.000Z',
        updatedAt: '2025-10-01T09:30:00.000Z'
      }
    }
  })
  @ApiParam({ 
    name: 'id', 
    description: '任务 ID',
    type: 'string',
    example: 'clx9abc123def456'
  })
  @ApiBody({ 
    type: UpdateTaskDto,
    description: '任务更新参数',
    schema: {
      example: {
        name: '更新的任务名称',
        cron: '0 0 3 * * *',
        payload: { userId: 456, action: 'updated_action' },
        status: 'SCHEDULED'
      }
    }
  })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.service.update(id, dto);
  }

  @ApiOperation({ 
    summary: '删除任务（会移除对应队列任务）',
    description: '删除指定任务，会同时移除对应的BullMQ队列任务。对于Cron任务会移除重复任务，对于一次性任务会移除具体任务'
  })
  @ApiOkResponse({ 
    type: OkResponse,
    description: '删除成功响应',
    schema: {
      type: 'object',
      additionalProperties: true,
      example: { ok: true }
    }
  })
  @ApiParam({ 
    name: 'id', 
    description: '任务 ID',
    type: 'string',
    example: 'clx9abc123def456'
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @ApiOperation({ 
    summary: '暂停整个任务队列（数据库状态标记为 PAUSED）',
    description: '暂停整个任务队列，所有状态为SCHEDULED的任务会被标记为PAUSED状态，队列处理会被暂停'
  })
  @ApiOkResponse({ 
    type: OkResponse,
    description: '暂停成功响应',
    schema: {
      type: 'object',
      additionalProperties: true,
      example: { ok: true }
    }
  })
  @Post('pause')
  pause() {
    return this.service.pauseQueue();
  }

  @ApiOperation({ 
    summary: '恢复整个任务队列（数据库状态恢复为 SCHEDULED）',
    description: '恢复被暂停的任务队列，所有状态为PAUSED的任务会被恢复为SCHEDULED状态，队列处理会重新启动'
  })
  @ApiOkResponse({ 
    type: OkResponse,
    description: '恢复成功响应',
    schema: {
      type: 'object',
      additionalProperties: true,
      example: { ok: true }
    }
  })
  @Post('resume')
  resume() {
    return this.service.resumeQueue();
  }

  @ApiOperation({ 
    summary: '立即执行某任务一次（不改变其计划）',
    description: '立即触发执行指定的任务一次，不改变任务原有的执行计划。对于Cron任务，会创建一个独立的立即执行任务'
  })
  @ApiOkResponse({ 
    type: RunNowResponse,
    description: '立即执行任务的响应，包含新创建的任务ID',
    schema: {
      type: 'object',
      additionalProperties: true,
      example: { jobId: 'job_987654' }
    }
  })
  @ApiParam({ 
    name: 'id', 
    description: '任务 ID',
    type: 'string',
    example: 'clx9abc123def456'
  })
  @Post(':id/run')
  runNow(@Param('id') id: string) {
    return this.service.runNow(id);
  }
}
