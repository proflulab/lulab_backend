/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-07-06 05:05:43
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-07-28 04:11:15
 * @FilePath: /lulab_backend/src/email/email.controller.ts
 * @Description:
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import {
  Controller,
  Post,
  Body,
  Get,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';
import { Public } from '@libs/security';

@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  @Public()
  @ApiOperation({ summary: '发送邮件', description: '发送邮件到指定收件人' })
  @ApiBody({ type: SendEmailDto })
  @ApiResponse({ status: 200, description: '邮件发送成功' })
  @ApiResponse({ status: 400, description: '邮件发送失败' })
  @ApiResponse({ status: 500, description: '服务器内部错误' })
  async sendEmail(@Body() sendEmailDto: SendEmailDto) {
    try {
      const result = await this.emailService.sendEmail(sendEmailDto);

      if (result.success) {
        return {
          statusCode: HttpStatus.OK,
          message: '邮件发送成功',
          data: {
            messageId: result.messageId,
          },
        };
      } else {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: '邮件发送失败',
            error: result.error,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: '服务器内部错误',
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('verify')
  @Public()
  @ApiOperation({
    summary: '验证SMTP连接',
    description: '验证邮件服务器连接状态',
  })
  @ApiResponse({ status: 200, description: 'SMTP连接验证结果' })
  @ApiResponse({ status: 500, description: '验证连接时发生错误' })
  async verifyConnection() {
    try {
      const isConnected = await this.emailService.verifyConnection();

      return {
        statusCode: HttpStatus.OK,
        message: isConnected ? 'SMTP连接正常' : 'SMTP连接失败',
        data: {
          connected: isConnected,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: '验证连接时发生错误',
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
