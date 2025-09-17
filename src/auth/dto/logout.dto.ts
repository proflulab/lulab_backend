import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LogoutDto {
  @ApiProperty({
    description:
      '刷新令牌（可选），在不提供 refreshToken 时，撤销该用户的所有 refreshToken。',
    required: false,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh...',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiProperty({
    description: '设备信息（可选），用于撤销特定设备的所有令牌',
    required: false,
    example: 'mobile-app-ios',
  })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty({
    description: '是否撤销所有设备的令牌（可选）',
    required: false,
    default: false,
    example: false,
  })
  @IsOptional()
  revokeAllDevices?: boolean;
}
