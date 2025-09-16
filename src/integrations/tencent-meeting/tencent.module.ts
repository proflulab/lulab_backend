import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TencentApiService } from './tencent-api.service';

@Module({
  imports: [ConfigModule],
  providers: [TencentApiService],
  exports: [TencentApiService],
})
export class TencentModule {}
