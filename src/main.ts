/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-27 05:18:41
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-27 05:19:07
 * @FilePath: /lulab_backend/src/main.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
