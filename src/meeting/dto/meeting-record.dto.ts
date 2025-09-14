import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MeetingPlatform, MeetingType, ProcessingStatus } from '@prisma/client';
import { Transform } from 'class-transformer';

/**
 * 会议记录查询DTO
 */
export class QueryMeetingRecordsDto {
  @ApiPropertyOptional({
    description: '会议平台',
    enum: MeetingPlatform,
    example: MeetingPlatform.TENCENT_MEETING,
  })
  @IsOptional()
  @IsEnum(MeetingPlatform)
  platform?: MeetingPlatform;

  @ApiPropertyOptional({
    description: '会议状态',
    enum: ProcessingStatus,
    example: ProcessingStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(ProcessingStatus)
  status?: ProcessingStatus;

  @ApiPropertyOptional({
    description: '会议类型',
    enum: MeetingType,
    example: MeetingType.SCHEDULED,
  })
  @IsOptional()
  @IsEnum(MeetingType)
  type?: MeetingType;

  @ApiPropertyOptional({
    description: '开始日期',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: '结束日期',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: '页码',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(String(value)))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: '每页数量',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(String(value)))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: '搜索关键词（会议主题、主持人等）',
    example: '项目讨论',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

/**
 * 会议记录响应DTO
 */
export class MeetingRecordResponseDto {
  @ApiProperty({ description: '会议记录ID' })
  id: string;

  @ApiProperty({ description: '会议平台', enum: MeetingPlatform })
  platform: MeetingPlatform;

  @ApiProperty({ description: '平台会议ID' })
  platformMeetingId: string;

  @ApiPropertyOptional({ description: '平台录制ID' })
  platformRecordingId?: string | null;

  @ApiProperty({ description: '会议标题' })
  title: string;

  @ApiPropertyOptional({ description: '会议号' })
  meetingCode?: string | null;

  @ApiProperty({ description: '会议类型', enum: MeetingType })
  type: MeetingType;

  @ApiPropertyOptional({ description: '主持人用户ID' })
  hostUserId?: string | null;

  @ApiPropertyOptional({ description: '主持人用户名' })
  hostUserName?: string | null;

  @ApiPropertyOptional({ description: '实际开始时间' })
  actualStartAt?: Date | null;

  @ApiPropertyOptional({ description: '结束时间' })
  endedAt?: Date | null;

  @ApiPropertyOptional({ description: '持续时间（分钟）' })
  duration?: number | null;

  @ApiProperty({ description: '是否有录制' })
  hasRecording: boolean;

  @ApiProperty({ description: '录制状态', enum: ProcessingStatus })
  recordingStatus: ProcessingStatus;

  @ApiProperty({ description: '处理状态', enum: ProcessingStatus })
  processingStatus: ProcessingStatus;

  @ApiPropertyOptional({ description: '转录内容' })
  transcript?: any;

  @ApiPropertyOptional({ description: '会议摘要' })
  summary?: string | null;

  @ApiPropertyOptional({ description: '参会人数' })
  participantCount?: number | null;

  @ApiPropertyOptional({ description: '参会者列表' })
  participantList?: any;

  @ApiPropertyOptional({ description: '元数据' })
  metadata?: any;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

/**
 * 会议记录列表响应DTO
 */
export class MeetingRecordListResponseDto {
  @ApiProperty({
    description: '会议记录列表',
    type: [MeetingRecordResponseDto],
  })
  data: MeetingRecordResponseDto[];

  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '当前页' })
  page: number;

  @ApiProperty({ description: '每页数量' })
  limit: number;

  @ApiProperty({ description: '总页数' })
  totalPages: number;
}
