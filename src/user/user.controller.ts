import {
  Controller,
  Get,
  Put,
  Body,
  Req,
  UseGuards,
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
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User, CurrentUser } from '../auth/user.decorator';
import {
  UpdateProfileDto,
  UserProfileResponseDto,
} from '../dto/auth.dto';

@ApiTags('用户')
@Controller('api/user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly authService: AuthService) {}

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