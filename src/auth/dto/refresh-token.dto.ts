import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: '刷新令牌' })
  @IsString()
  refreshToken: string;

  @ApiProperty({ required: false, description: '设备信息，如设备型号、操作系统等' })
  @IsOptional()
  @IsString()
  deviceInfo?: string;

  @ApiProperty({ required: false, description: '设备ID，用于标识唯一设备' })
  @IsOptional()
  @IsString()
  deviceId?: string;
}