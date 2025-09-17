import { Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '../redis/redis.module';

// Services
import {
  MeetingQueueService,
  EmailQueueService,
  ExternalApiQueueService,
  QueueMonitoringService,
} from './services';

// Workers
import { MeetingWorker, EmailWorker, ExternalApiWorker } from './workers';

// Controller
import { QueueController } from './queue.controller';

@Module({
  imports: [ConfigModule, RedisModule],
  controllers: [QueueController],
  providers: [
    // Queue Services
    MeetingQueueService,
    EmailQueueService,
    ExternalApiQueueService,
    QueueMonitoringService,

    // Workers
    MeetingWorker,
    EmailWorker,
    ExternalApiWorker,
  ],
  exports: [
    // Export queue services for use in other modules
    MeetingQueueService,
    EmailQueueService,
    ExternalApiQueueService,
    QueueMonitoringService,
  ],
})
export class QueueModule implements OnModuleDestroy {
  constructor(
    private readonly meetingWorker: MeetingWorker,
    private readonly emailWorker: EmailWorker,
    private readonly externalApiWorker: ExternalApiWorker,
    private readonly queueMonitoringService: QueueMonitoringService,
  ) {}

  async onModuleDestroy(): Promise<void> {
    // Gracefully shutdown workers and monitoring
    await Promise.all([
      this.meetingWorker.close(),
      this.emailWorker.close(),
      this.externalApiWorker.close(),
      this.queueMonitoringService.close(),
    ]);
  }
}
