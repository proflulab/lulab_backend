/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-07-06 05:58:54
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-07-28 13:03:27
 * @FilePath: /lulab_backend/src/app.controller.ts
 * @Description Application controller module, responsible for handling core logic and routing.
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Default')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @ApiOperation({ summary: '获取欢迎信息' })
  @ApiResponse({ status: 200, description: '返回欢迎信息', type: String })
  @ApiBearerAuth()
  getHello(): string {
    return this.appService.getHello();
  }
}
