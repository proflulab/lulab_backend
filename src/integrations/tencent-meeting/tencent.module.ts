import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TencentApiService } from './api.service';

@Module({
  imports: [ConfigModule],
  providers: [TencentApiService],
  exports: [TencentApiService],
})
export class TencentModule {}
