/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2026-01-01 07:20:14
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-01 07:20:51
 * @FilePath: /lulab_backend/src/meeting/dto/sync-recordings.dto.ts
 * @Description:
 *
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved.
 */
import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * 同步腾讯会议录制记录请求DTO
 */
export class SyncTencentRecordingsDto {
  @ApiProperty({
    description: '开始时间（Unix时间戳，秒）',
    example: 1704067200,
  })
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(String(value)))
  startTime: number;

  @ApiProperty({
    description: '结束时间（Unix时间戳，秒）',
    example: 1706745600,
  })
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(String(value)))
  endTime: number;

  @ApiPropertyOptional({
    description: '每页数量（最大20，默认10）',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  @Transform(({ value }) => parseInt(String(value)))
  pageSize?: number = 10;

  @ApiPropertyOptional({
    description: '操作员ID',
    example: 'operator123',
  })
  @IsOptional()
  operatorId?: string;
}

/**
 * 同步录制记录响应DTO
 */
export class SyncRecordingsResponseDto {
  @ApiProperty({ description: '同步的录制记录数量' })
  syncedCount: number;

  @ApiProperty({ description: '新增的录制记录数量' })
  createdCount: number;

  @ApiProperty({ description: '更新的录制记录数量' })
  updatedCount: number;

  @ApiProperty({ description: '总页数' })
  totalPages: number;

  @ApiProperty({ description: '当前页数' })
  currentPage: number;

  @ApiProperty({ description: '每页大小' })
  pageSize: number;

  @ApiProperty({ description: '总记录数' })
  totalRecords: number;

  @ApiProperty({ description: '同步时间' })
  syncedAt: Date;
}
