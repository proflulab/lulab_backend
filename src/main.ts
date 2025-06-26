import { NestFactory } from '@nestjs/core';
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
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
