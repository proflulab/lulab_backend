import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { SendCodeDto } from './dto/send-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { Public } from '../security';
import {
  ApiSendCodeDocs,
  ApiVerifyCodeDocs,
} from '@/verification/decorators/api-docs.decorator';
import { Request } from 'express';
import { Req } from '@nestjs/common';

@ApiTags('Verification')
@Controller({ path: 'api/verification', version: '1' })
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Public()
  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiSendCodeDocs()
  async send(@Body(ValidationPipe) dto: SendCodeDto, @Req() req: Request) {
    const ip = this.getClientIp(req);
    const userAgent = req.get('User-Agent');
    return this.verificationService.sendCode(
      dto.target,
      dto.type,
      ip,
      userAgent,
      dto.countryCode,
    );
  }

  @Public()
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiVerifyCodeDocs()
  async verify(@Body(ValidationPipe) dto: VerifyCodeDto) {
    return this.verificationService.verifyCode(dto.target, dto.code, dto.type);
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      '127.0.0.1'
    );
  }
}
