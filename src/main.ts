/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-27 05:18:41
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-07-06 05:12:36
 * @FilePath: /lulab_backend/src/main.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 启用全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // 自动删除非DTO属性
    forbidNonWhitelisted: true, // 当有非白名单属性时抛出错误
    transform: true, // 自动转换类型
  }));

  // Swagger配置
  const config = new DocumentBuilder()
    .setTitle('LuLab Backend API')
    .setDescription('LuLab Backend API文档')
    .setVersion('1.0')
    .addTag('api')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
