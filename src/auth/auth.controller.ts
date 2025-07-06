import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Public } from './public.decorator';
import { User, CurrentUser } from './user.decorator';
import {
  RegisterDto,
  LoginDto,
  SendCodeDto,
  VerifyCodeDto,
  ResetPasswordDto,
  UpdateProfileDto,
  AuthResponseDto,
  UserProfileResponseDto,
} from '../dto/auth.dto';

@ApiTags('认证')
@Controller('api/auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '用户注册',
    description: '用户注册需要先通过邮箱或手机号验证码验证。支持的注册类型：email_code（邮箱验证码）、phone_code（手机验证码）。为了安全考虑，不再支持纯用户名密码注册。'
  })
  @ApiResponse({
    status: 201,
    description: '注册成功',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: '请求参数错误或使用了不支持的注册方式' })
  @ApiResponse({ status: 409, description: '用户已存在' })
  @ApiBody({ type: RegisterDto })
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
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({
    status: 200,
    description: '登录成功',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: '认证失败' })
  @ApiResponse({ status: 429, description: '登录尝试过于频繁' })
  @ApiBody({ type: LoginDto })
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const ip = this.getClientIp(req);
    const userAgent = req.get('User-Agent');
    return await this.authService.login(loginDto, ip, userAgent);
  }

  @Public()
  @Post('send-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '发送验证码',
    description: '向指定的邮箱或手机号发送验证码。支持注册、登录、重置密码等场景。发送频率限制：同一目标60秒内只能发送一次。'
  })
  @ApiResponse({
    status: 200,
    description: '验证码发送成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '验证码已发送，请查收' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '邮箱格式不正确' },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: '发送过于频繁',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '发送过于频繁，请稍后再试' },
      },
    },
  })
  @ApiBody({
    type: SendCodeDto,
    examples: {
      email_register: {
        summary: '邮箱注册验证码',
        description: '为邮箱注册发送验证码',
        value: {
          target: 'user@example.com',
          type: 'register',
        },
      },
      phone_register: {
        summary: '手机注册验证码',
        description: '为手机号注册发送验证码',
        value: {
          target: '13800138000',
          type: 'register',
          countryCode: '+86',
        },
      },
      email_login: {
        summary: '邮箱登录验证码',
        description: '为邮箱登录发送验证码',
        value: {
          target: 'user@example.com',
          type: 'login',
        },
      },
      phone_login: {
        summary: '手机登录验证码',
        description: '为手机号登录发送验证码',
        value: {
          target: '13800138000',
          type: 'login',
          countryCode: '+86',
        },
      },
      reset_password: {
        summary: '重置密码验证码',
        description: '为重置密码发送验证码',
        value: {
          target: 'user@example.com',
          type: 'reset_password',
        },
      },
    },
  })
  async sendCode(
    @Body(ValidationPipe) sendCodeDto: SendCodeDto,
    @Req() req: Request,
  ): Promise<{ success: boolean; message: string }> {
    const ip = this.getClientIp(req);
    const userAgent = req.get('User-Agent');
    return await this.authService.sendCode(sendCodeDto, ip, userAgent);
  }

  @Public()
  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '验证验证码' })
  @ApiResponse({
    status: 200,
    description: '验证码验证结果',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiBody({ type: VerifyCodeDto })
  async verifyCode(
    @Body(ValidationPipe) verifyCodeDto: VerifyCodeDto,
  ): Promise<{ valid: boolean; message: string }> {
    return await this.authService.verifyCode(verifyCodeDto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '重置密码' })
  @ApiResponse({
    status: 200,
    description: '密码重置成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(
    @Body(ValidationPipe) resetPasswordDto: ResetPasswordDto,
    @Req() req: Request,
  ): Promise<{ success: boolean; message: string }> {
    const ip = this.getClientIp(req);
    const userAgent = req.get('User-Agent');
    return await this.authService.resetPassword(resetPasswordDto, ip, userAgent);
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '刷新访问令牌' })
  @ApiResponse({
    status: 200,
    description: '令牌刷新成功',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: '刷新令牌无效' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: { type: 'string' },
      },
      required: ['refreshToken'],
    },
  })
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ accessToken: string }> {
    return await this.authService.refreshToken(refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '退出登录' })
  @ApiResponse({ status: 200, description: '退出成功' })
  @ApiBearerAuth()
  async logout(): Promise<{ success: boolean; message: string }> {
    // JWT是无状态的，客户端删除token即可
    // 如果需要实现token黑名单，可以在这里添加逻辑
    return {
      success: true,
      message: '退出登录成功',
    };
  }

  @Get('profile')
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({
    status: 200,
    description: '获取用户信息成功',
    type: UserProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiBearerAuth()
  async getProfile(@User() user: CurrentUser): Promise<UserProfileResponseDto> {
    return await this.authService.getProfile(user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: '更新用户资料' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: UserProfileResponseDto,
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 409, description: '用户名/邮箱/手机号已被使用' })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateProfileDto })
  async updateProfile(
    @User() user: CurrentUser,
    @Body(ValidationPipe) updateProfileDto: UpdateProfileDto,
    @Req() req: Request,
  ): Promise<UserProfileResponseDto> {
    const ip = this.getClientIp(req);
    const userAgent = req.get('User-Agent');
    return await this.authService.updateProfile(
      user.id,
      updateProfileDto,
      ip,
      userAgent,
    );
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      '127.0.0.1'
    );
  }
}