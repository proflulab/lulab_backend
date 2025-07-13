import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * 分页查询DTO
 */
export class PaginationDto {
    @ApiPropertyOptional({
        description: '页码',
        minimum: 1,
        default: 1,
        example: 1
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: '每页数量',
        minimum: 1,
        maximum: 100,
        default: 10,
        example: 10
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 10;
}

/**
 * 分页响应DTO
 */
export class PaginationResponseDto<T> {
    @ApiPropertyOptional({ description: '数据列表' })
    data: T[];

    @ApiPropertyOptional({ description: '总数' })
    total: number;

    @ApiPropertyOptional({ description: '当前页' })
    page: number;

    @ApiPropertyOptional({ description: '每页数量' })
    limit: number;

    @ApiPropertyOptional({ description: '总页数' })
    totalPages: number;

    @ApiPropertyOptional({ description: '是否有下一页' })
    hasNext: boolean;

    @ApiPropertyOptional({ description: '是否有上一页' })
    hasPrev: boolean;

    constructor(data: T[], total: number, page: number, limit: number) {
        this.data = data;
        this.total = total;
        this.page = page;
        this.limit = limit;
        this.totalPages = Math.ceil(total / limit);
        this.hasNext = page < this.totalPages;
        this.hasPrev = page > 1;
    }
}

/**
 * 分页计算工具
 */
export class PaginationUtils {
    /**
     * 计算偏移量
     */
    static getOffset(page: number, limit: number): number {
        return (page - 1) * limit;
    }

    /**
     * 创建分页响应
     */
    static createResponse<T>(
        data: T[],
        total: number,
        page: number,
        limit: number
    ): PaginationResponseDto<T> {
        return new PaginationResponseDto(data, total, page, limit);
    }
}