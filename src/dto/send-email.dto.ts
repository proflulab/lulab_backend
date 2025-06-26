/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-27 05:01:10
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-27 05:01:53
 * @FilePath: /lulab_backend/src/dto/send-email.dto.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { IsEmail, IsString, IsOptional, IsArray } from 'class-validator';

export class SendEmailDto {
    @IsEmail()
    to: string;

    @IsOptional()
    @IsArray()
    @IsEmail({}, { each: true })
    cc?: string[];

    @IsOptional()
    @IsArray()
    @IsEmail({}, { each: true })
    bcc?: string[];

    @IsString()
    subject: string;

    @IsString()
    text: string;

    @IsOptional()
    @IsString()
    html?: string;
}