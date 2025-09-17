import { Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker, Job, UnrecoverableError } from 'bullmq';
import { RedisService } from '../../redis/redis.service';
import {
    QueueName,
    JobType,
    BaseJobData,
    JobResult,
} from '../types';
import { getQueueConfig } from '../config/queue.config';

/**
 * Base worker class providing common worker functionality
 */
export abstract class BaseWorker<T extends BaseJobData = BaseJobData>
    implements OnModuleDestroy {
    protected readonly logger = new Logger(this.constructor.name);
    protected worker: Worker;
    protected queueConfig: ReturnType<typeof getQueueConfig>;

    constructor(
        protected readonly configService: ConfigService,
        protected readonly redisService: RedisService,
        protected readonly queueName: QueueName,
        protected readonly concurrency: number = 1,
    ) {
        this.queueConfig = getQueueConfig(this.configService);
        this.initializeWorker();
    }

    /**
     * Initialize the worker
     */
    private initializeWorker(): void {
        if (!this.redisService.isReady()) {
            this.logger.warn(`Redis not ready, worker for ${this.queueName} disabled`);
            return;
        }

        this.worker = new Worker(
            this.queueName,
            async (job: Job<T>) => {
                return this.processJob(job);
            },
            {
                connection: this.queueConfig.connection,
                concurrency: this.concurrency,
            },
        );

        this.setupWorkerEvents();
    }

    /**
     * Setup worker event listeners
     */
    private setupWorkerEvents(): void {
        this.worker.on('ready', () => {
            this.logger.log(`Worker for queue ${this.queueName} is ready`);
        });

        this.worker.on('error', (error) => {
            this.logger.error(`Worker error in queue ${this.queueName}:`, error);
        });

        this.worker.on('active', (job) => {
            this.logger.debug(`Processing job ${job.id} in queue ${this.queueName}`);
        });

        this.worker.on('completed', (job, result) => {
            this.logger.debug(
                `Job ${job.id} completed in queue ${this.queueName}`,
                { result },
            );
        });

        this.worker.on('failed', (job, err) => {
            this.logger.error(
                `Job ${job?.id} failed in queue ${this.queueName}:`,
                err,
            );
        });

        this.worker.on('stalled', (jobId) => {
            this.logger.warn(`Job ${jobId} stalled in queue ${this.queueName}`);
        });
    }

    /**
     * Process a job - to be implemented by subclasses
     */
    protected abstract processJob(job: Job<T>): Promise<JobResult>;

    /**
     * Execute job with error handling and idempotency
     */
    protected async executeJob(
        job: Job<T>,
        processor: (data: T) => Promise<any>,
    ): Promise<JobResult> {
        const startTime = Date.now();
        const { idempotencyKey } = job.data;

        try {
            this.logger.debug(`Starting job ${job.id} with key ${idempotencyKey}`);

            // Pre-execution validation
            await this.validateJobData(job.data);

            // Execute the job
            const result = await processor(job.data);

            const jobResult: JobResult = {
                success: true,
                data: result,
                timestamp: new Date(),
                duration: Date.now() - startTime,
            };

            // Mark as processed for idempotency
            await this.markJobAsProcessed(idempotencyKey, jobResult);

            this.logger.debug(
                `Job ${job.id} completed successfully in ${jobResult.duration}ms`,
            );

            return jobResult;
        } catch (error) {
            const jobResult: JobResult = {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date(),
                duration: Date.now() - startTime,
            };

            this.logger.error(
                `Job ${job.id} failed after ${jobResult.duration}ms:`,
                error,
            );

            // Determine if error is recoverable
            if (this.isUnrecoverableError(error)) {
                throw new UnrecoverableError(jobResult.error);
            }

            throw error;
        }
    }

    /**
     * Validate job data before processing
     */
    protected async validateJobData(data: T): Promise<void> {
        if (!data.idempotencyKey) {
            throw new Error('Job data must include idempotencyKey');
        }

        if (!data.createdAt) {
            throw new Error('Job data must include createdAt');
        }

        // Check if job is too old (optional)
        const maxAge = this.configService.get<number>('QUEUE_MAX_JOB_AGE_HOURS', 24);
        const jobAge = (Date.now() - new Date(data.createdAt).getTime()) / (1000 * 60 * 60);

        if (jobAge > maxAge) {
            throw new UnrecoverableError(`Job is too old: ${jobAge} hours`);
        }
    }

    /**
     * Mark job as processed for idempotency
     */
    protected async markJobAsProcessed(
        idempotencyKey: string,
        result: JobResult,
    ): Promise<void> {
        if (!this.redisService.isReady()) {
            return;
        }

        try {
            const redis = this.redisService.getClient();
            const key = `idempotency:${this.queueName}:${idempotencyKey}`;
            const ttl = this.configService.get<number>('QUEUE_IDEMPOTENCY_TTL', 86400);

            await redis?.setex(key, ttl, JSON.stringify(result));
        } catch (error) {
            this.logger.error('Failed to mark job as processed:', error);
        }
    }

    /**
     * Determine if an error is unrecoverable
     */
    protected isUnrecoverableError(error: any): boolean {
        // Add logic to determine unrecoverable errors
        if (error instanceof UnrecoverableError) {
            return true;
        }

        // Common unrecoverable error patterns
        const unrecoverablePatterns = [
            /validation/i,
            /invalid.*format/i,
            /malformed/i,
            /unauthorized/i,
            /forbidden/i,
            /not found/i,
            /duplicate/i,
        ];

        const errorMessage = error?.message || String(error);
        return unrecoverablePatterns.some(pattern => pattern.test(errorMessage));
    }

    /**
     * Get worker instance
     */
    getWorker(): Worker | null {
        return this.worker;
    }

    /**
     * Pause the worker
     */
    async pause(): Promise<void> {
        if (this.worker) {
            await this.worker.pause();
            this.logger.log(`Worker for queue ${this.queueName} paused`);
        }
    }

    /**
     * Resume the worker
     */
    async resume(): Promise<void> {
        if (this.worker) {
            await this.worker.resume();
            this.logger.log(`Worker for queue ${this.queueName} resumed`);
        }
    }

    /**
     * Close the worker
     */
    async close(): Promise<void> {
        if (this.worker) {
            await this.worker.close();
            this.logger.log(`Worker for queue ${this.queueName} closed`);
        }
    }

    /**
     * Module destroy lifecycle
     */
    async onModuleDestroy(): Promise<void> {
        await this.close();
    }
}