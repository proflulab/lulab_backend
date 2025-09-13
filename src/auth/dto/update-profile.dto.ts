import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength, Matches } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ required: false, description: '用户名' })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: '用户名至少3个字符' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: '用户名只能包含字母、数字和下划线' })
  username?: string;

  @ApiProperty({ required: false, description: '邮箱' })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @ApiProperty({ required: false, description: '国家代码，如 +86' })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiProperty({ required: false, description: '手机号' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, description: '头像URL' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ required: false, description: '姓名或昵称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, description: '个人简介' })
  @IsOptional()
  @IsString()
  bio?: string;
}

