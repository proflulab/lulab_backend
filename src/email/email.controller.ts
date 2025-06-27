import { Controller, Post, Body, Get, HttpStatus, HttpException } from '@nestjs/common';
import { EmailService } from './email.service';
import { SendEmailDto } from '../dto/send-email.dto';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) { }

  @Post('send')
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
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('verify')
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
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}