import {
  Controller,
  Post,
  Body,
  Req,
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
import { RegisterService } from './services/register.service';
import { LoginService } from './services/login.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { Public } from '../security';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { TokenBlacklistService } from './services/token-blacklist.service';

@ApiTags('Auth')
@Controller({
  path: 'api/auth',
  version: '1',
})
export class AuthController {
  constructor(
    private readonly registerService: RegisterService,
    private readonly loginService: LoginService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly tokenBlacklist: TokenBlacklistService,
  ) {}

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
    return await this.registerService.register(registerDto, ip, userAgent);
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
    return await this.loginService.login(loginDto, ip, userAgent);
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
    return await this.passwordService.resetPassword(
      resetPasswordDto,
      ip,
      userAgent,
    );
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiRefreshTokenDocs()
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ accessToken: string }> {
    return await this.tokenService.refreshToken(refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiLogoutDocs()
  @ApiBearerAuth()
  async logout(
    @Req() req: Request,
  ): Promise<{ success: boolean; message: string }> {
    // 将当前访问令牌加入黑名单（直到其过期）
    const authHeader = req.get('authorization') || req.get('Authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : undefined;
    if (token) {
      await this.tokenBlacklist.add(token);
    }
    return {
      success: true,
      message: '退出登录成功',
    };
  }

  private getClientIp(req: Request): string {
    const xff = req.headers['x-forwarded-for'];
    const xReal = req.headers['x-real-ip'];
    const forwarded = Array.isArray(xff) ? xff[0] : xff?.split(',')[0];
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
