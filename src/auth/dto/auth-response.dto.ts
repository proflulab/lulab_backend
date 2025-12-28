import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ description: '访问令牌' })
  accessToken: string;

  @ApiProperty({ description: '刷新令牌' })
  refreshToken: string;

  @ApiProperty({ description: '用户基本信息' })
  user: {
    id: string;
    username?: string;
    email: string;
    phone?: string;
    countryCode?: string;
    createdAt: Date;
  };
}
