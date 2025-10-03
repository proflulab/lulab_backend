/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-10-03 06:04:16
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-10-03 06:44:33
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
import { ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateOnceDto } from './dtos/create-once.dto';
import { CreateCronDto } from './dtos/create-cron.dto';
import { UpdateTaskDto } from './dtos/update-task.dto';
import { QueryDto } from './dtos/query.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly service: TasksService) {}

  @Post('once')
  @ApiBearerAuth()
  createOnce(@Body() dto: CreateOnceDto) {
    return this.service.createOnce(dto);
  }

  @Post('cron')
  @ApiBearerAuth()
  createCron(@Body() dto: CreateCronDto) {
    return this.service.createCron(dto);
  }

  @Get()
  @ApiBearerAuth()
  list(@Query() q: QueryDto) {
    return this.service.list(q);
  }

  @Get(':id')
  @ApiBearerAuth()
  detail(@Param('id') id: string) {
    return this.service.detail(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('pause')
  @ApiBearerAuth()
  pause() {
    return this.service.pauseQueue();
  }

  @Post('resume')
  @ApiBearerAuth()
  resume() {
    return this.service.resumeQueue();
  }

  @Post(':id/run')
  @ApiBearerAuth()
  runNow(@Param('id') id: string) {
    return this.service.runNow(id);
  }
}
