import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  ApiRegisterDocs,
  ApiLoginDocs,
  ApiResetPasswordDocs,
  ApiRefreshTokenDocs,
  ApiLogoutDocs,
} from './decorators/api-docs.decorator';
import { Request } from 'express';
import { AuthService } from './services/auth.service';
import { JwtAuthGuard, Public } from '@libs/security';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@ApiTags('Auth')
@Controller({
  path: 'api/auth',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiRegisterDocs()
  async register(
    @Body(ValidationPipe) registerDto: RegisterDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const ip = this.getClientIp(req);
    const userAgent = req.get('User-Agent');
    return await this.authService.register(registerDto, ip, userAgent);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiLoginDocs()
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const ip = this.getClientIp(req);
    const userAgent = req.get('User-Agent');
    return await this.authService.login(loginDto, ip, userAgent);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiResetPasswordDocs()
  async resetPassword(
    @Body(ValidationPipe) resetPasswordDto: ResetPasswordDto,
    @Req() req: Request,
  ): Promise<{ success: boolean; message: string }> {
    const ip = this.getClientIp(req);
    const userAgent = req.get('User-Agent');
    return await this.authService.resetPassword(
      resetPasswordDto,
      ip,
      userAgent,
    );
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiRefreshTokenDocs()
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ accessToken: string }> {
    return await this.authService.refreshToken(refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiLogoutDocs()
  @ApiBearerAuth()
  async logout(): Promise<{ success: boolean; message: string }> {
    // JWT是无状态的，客户端删除token即可
    // 如果需要实现token黑名单，可以在这里添加逻辑
    return Promise.resolve({
      success: true,
      message: '退出登录成功',
    });
  }

  private getClientIp(req: Request): string {
    const xff = req.headers['x-forwarded-for'];
    const xReal = req.headers['x-real-ip'];
    const forwarded = Array.isArray(xff)
      ? xff[0]
      : xff?.split(',')[0];
    const realIp = Array.isArray(xReal) ? xReal[0] : xReal;

    return (
      forwarded?.trim() ||
      realIp?.trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      '127.0.0.1'
    );
  }
}
