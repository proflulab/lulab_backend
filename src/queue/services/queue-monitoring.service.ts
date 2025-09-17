import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, QueueEvents } from 'bullmq';
import { RedisService } from '../../redis/redis.service';
import { QueueName, QueueMetrics, JobStatus } from '../types';
import { getQueueConfig } from '../config/queue.config';

/**
 * Queue monitoring service
 */
@Injectable()
export class QueueMonitoringService {
    private readonly logger = new Logger(QueueMonitoringService.name);
    private queueEvents: Map<QueueName, QueueEvents> = new Map();
    private queues: Map<QueueName, Queue> = new Map();
    private queueConfig: ReturnType<typeof getQueueConfig>;

    constructor(
        private readonly configService: ConfigService,
        private readonly redisService: RedisService,
    ) {
        this.queueConfig = getQueueConfig(this.configService);
        this.initializeMonitoring();
    }

    /**
     * Initialize queue monitoring
     */
    private initializeMonitoring(): void {
        if (!this.redisService.isReady()) {
            this.logger.warn('Redis not ready, queue monitoring disabled');
            return;
        }

        Object.values(QueueName).forEach((queueName) => {
            this.setupQueueMonitoring(queueName);
        });
    }

    /**
     * Setup monitoring for a specific queue
     */
    private setupQueueMonitoring(queueName: QueueName): void {
        try {
            // Create queue instance for monitoring
            const queue = new Queue(queueName, {
                connection: this.queueConfig.connection,
            });
            this.queues.set(queueName, queue);

            // Create queue events listener
            const queueEvents = new QueueEvents(queueName, {
                connection: this.queueConfig.connection,
            });
            this.queueEvents.set(queueName, queueEvents);

            // Setup event listeners
            this.setupEventListeners(queueName, queueEvents);

            this.logger.log(`Monitoring initialized for queue: ${queueName}`);
        } catch (error) {
            this.logger.error(`Failed to setup monitoring for queue ${queueName}:`, error);
        }
    }

    /**
     * Setup event listeners for queue monitoring
     */
    private setupEventListeners(queueName: QueueName, queueEvents: QueueEvents): void {
        // Job lifecycle events
        queueEvents.on('waiting', ({ jobId }) => {
            this.logger.debug(`Job ${jobId} is waiting in queue ${queueName}`);
            this.recordJobEvent(queueName, jobId, 'waiting');
        });

        queueEvents.on('active', ({ jobId, prev }) => {
            this.logger.debug(`Job ${jobId} started processing in queue ${queueName}`);
            this.recordJobEvent(queueName, jobId, 'active');
        });

        queueEvents.on('completed', ({ jobId, returnvalue }) => {
            this.logger.debug(`Job ${jobId} completed in queue ${queueName}`);
            this.recordJobEvent(queueName, jobId, 'completed', { returnvalue });
        });

        queueEvents.on('failed', ({ jobId, failedReason }) => {
            this.logger.warn(`Job ${jobId} failed in queue ${queueName}: ${failedReason}`);
            this.recordJobEvent(queueName, jobId, 'failed', { failedReason });
        });

        queueEvents.on('delayed', ({ jobId, delay }) => {
            this.logger.debug(`Job ${jobId} delayed by ${delay}ms in queue ${queueName}`);
            this.recordJobEvent(queueName, jobId, 'delayed', { delay });
        });

        queueEvents.on('stalled', ({ jobId }) => {
            this.logger.warn(`Job ${jobId} stalled in queue ${queueName}`);
            this.recordJobEvent(queueName, jobId, 'stalled');
        });

        queueEvents.on('progress', ({ jobId, data }) => {
            this.logger.debug(`Job ${jobId} progress updated in queue ${queueName}:`, data);
        });

        // Queue events
        queueEvents.on('drained', () => {
            this.logger.debug(`Queue ${queueName} drained`);
        });

        queueEvents.on('resumed', () => {
            this.logger.log(`Queue ${queueName} resumed`);
        });

        queueEvents.on('paused', () => {
            this.logger.log(`Queue ${queueName} paused`);
        });

        // Error handling
        queueEvents.on('error', (error) => {
            this.logger.error(`Queue events error for ${queueName}:`, error);
        });
    }

    /**
     * Record job event for metrics
     */
    private recordJobEvent(
        queueName: QueueName,
        jobId: string,
        status: string,
        metadata?: any,
    ): void {
        // In a real implementation, this would:
        // 1. Store metrics in time-series database (InfluxDB, Prometheus)
        // 2. Update counters and gauges
        // 3. Trigger alerts if needed
        // 4. Update dashboard data

        const event = {
            queueName,
            jobId,
            status,
            timestamp: new Date(),
            metadata,
        };

        // For now, just log the event
        this.logger.debug('Job event recorded:', event);
    }

    /**
     * Get queue metrics
     */
    async getQueueMetrics(queueName: QueueName): Promise<QueueMetrics> {
        const queue = this.queues.get(queueName);
        if (!queue) {
            throw new Error(`Queue ${queueName} not found`);
        }

        try {
            const counts = await queue.getJobCounts(
                'waiting',
                'active',
                'completed',
                'failed',
                'delayed',
                'paused',
            );

            return {
                waiting: counts.waiting,
                active: counts.active,
                completed: counts.completed,
                failed: counts.failed,
                delayed: counts.delayed,
                paused: counts.paused,
            };
        } catch (error) {
            this.logger.error(`Failed to get metrics for queue ${queueName}:`, error);
            throw error;
        }
    }

    /**
     * Get all queue metrics
     */
    async getAllQueueMetrics(): Promise<Record<QueueName, QueueMetrics>> {
        const metrics: Partial<Record<QueueName, QueueMetrics>> = {};

        for (const queueName of Object.values(QueueName)) {
            try {
                metrics[queueName] = await this.getQueueMetrics(queueName);
            } catch (error) {
                this.logger.error(`Failed to get metrics for queue ${queueName}:`, error);
                metrics[queueName] = {
                    waiting: 0,
                    active: 0,
                    completed: 0,
                    failed: 0,
                    delayed: 0,
                    paused: 0,
                };
            }
        }

        return metrics as Record<QueueName, QueueMetrics>;
    }

    /**
     * Get queue health status
     */
    async getQueueHealth(queueName: QueueName): Promise<{
        healthy: boolean;
        metrics: QueueMetrics;
        issues: string[];
    }> {
        const metrics = await this.getQueueMetrics(queueName);
        const issues: string[] = [];

        // Define health check thresholds
        const maxWaiting = this.configService.get<number>('QUEUE_MAX_WAITING_JOBS', 100);
        const maxFailed = this.configService.get<number>('QUEUE_MAX_FAILED_JOBS', 50);
        const maxStalled = this.configService.get<number>('QUEUE_MAX_STALLED_JOBS', 10);

        // Check for potential issues
        if (metrics.waiting > maxWaiting) {
            issues.push(`Too many waiting jobs: ${metrics.waiting} (max: ${maxWaiting})`);
        }

        if (metrics.failed > maxFailed) {
            issues.push(`Too many failed jobs: ${metrics.failed} (max: ${maxFailed})`);
        }

        if (metrics.active === 0 && metrics.waiting > 0) {
            issues.push('No active workers but jobs are waiting');
        }

        return {
            healthy: issues.length === 0,
            metrics,
            issues,
        };
    }

    /**
     * Get overall system health
     */
    async getSystemHealth(): Promise<{
        healthy: boolean;
        queues: Record<string, { healthy: boolean; issues: string[] }>;
        summary: {
            totalWaiting: number;
            totalActive: number;
            totalCompleted: number;
            totalFailed: number;
        };
    }> {
        const queueHealths: Record<string, { healthy: boolean; issues: string[] }> = {};
        let totalWaiting = 0;
        let totalActive = 0;
        let totalCompleted = 0;
        let totalFailed = 0;

        for (const queueName of Object.values(QueueName)) {
            const health = await this.getQueueHealth(queueName);
            queueHealths[queueName] = {
                healthy: health.healthy,
                issues: health.issues,
            };

            totalWaiting += health.metrics.waiting;
            totalActive += health.metrics.active;
            totalCompleted += health.metrics.completed;
            totalFailed += health.metrics.failed;
        }

        const allHealthy = Object.values(queueHealths).every(q => q.healthy);

        return {
            healthy: allHealthy,
            queues: queueHealths,
            summary: {
                totalWaiting,
                totalActive,
                totalCompleted,
                totalFailed,
            },
        };
    }

    /**
     * Clean old completed/failed jobs from all queues
     */
    async cleanAllQueues(
        options: {
            completedMaxAge?: number; // milliseconds
            failedMaxAge?: number; // milliseconds
            limit?: number;
        } = {},
    ): Promise<Record<QueueName, { completed: number; failed: number }>> {
        const {
            completedMaxAge = 24 * 60 * 60 * 1000, // 24 hours
            failedMaxAge = 7 * 24 * 60 * 60 * 1000, // 7 days
            limit = 1000,
        } = options;

        const results: Partial<Record<QueueName, { completed: number; failed: number }>> = {};

        for (const [queueName, queue] of this.queues) {
            try {
                const [completedCount, failedCount] = await Promise.all([
                    queue.clean(completedMaxAge, limit, 'completed'),
                    queue.clean(failedMaxAge, limit, 'failed'),
                ]);

                results[queueName] = {
                    completed: completedCount.length,
                    failed: failedCount.length,
                };

                this.logger.log(
                    `Cleaned queue ${queueName}: ${completedCount.length} completed, ${failedCount.length} failed`,
                );
            } catch (error) {
                this.logger.error(`Failed to clean queue ${queueName}:`, error);
                results[queueName] = { completed: 0, failed: 0 };
            }
        }

        return results as Record<QueueName, { completed: number; failed: number }>;
    }

    /**
     * Get job details
     */
    async getJobDetails(queueName: QueueName, jobId: string): Promise<any> {
        const queue = this.queues.get(queueName);
        if (!queue) {
            throw new Error(`Queue ${queueName} not found`);
        }

        const job = await queue.getJob(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found in queue ${queueName}`);
        }

        return {
            id: job.id,
            name: job.name,
            data: job.data,
            progress: job.progress,
            returnvalue: job.returnvalue,
            failedReason: job.failedReason,
            finishedOn: job.finishedOn,
            processedOn: job.processedOn,
            timestamp: job.timestamp,
            attempts: job.attemptsMade,
            delay: job.delay,
            opts: job.opts,
        };
    }

    /**
     * Pause all queues
     */
    async pauseAllQueues(): Promise<void> {
        for (const [queueName, queue] of this.queues) {
            try {
                await queue.pause();
                this.logger.log(`Paused queue: ${queueName}`);
            } catch (error) {
                this.logger.error(`Failed to pause queue ${queueName}:`, error);
            }
        }
    }

    /**
     * Resume all queues
     */
    async resumeAllQueues(): Promise<void> {
        for (const [queueName, queue] of this.queues) {
            try {
                await queue.resume();
                this.logger.log(`Resumed queue: ${queueName}`);
            } catch (error) {
                this.logger.error(`Failed to resume queue ${queueName}:`, error);
            }
        }
    }

    /**
     * Close all monitoring connections
     */
    async close(): Promise<void> {
        // Close queue events
        for (const [queueName, queueEvents] of this.queueEvents) {
            try {
                await queueEvents.close();
                this.logger.log(`Closed queue events for: ${queueName}`);
            } catch (error) {
                this.logger.error(`Failed to close queue events for ${queueName}:`, error);
            }
        }

        // Close queues
        for (const [queueName, queue] of this.queues) {
            try {
                await queue.close();
                this.logger.log(`Closed queue: ${queueName}`);
            } catch (error) {
                this.logger.error(`Failed to close queue ${queueName}:`, error);
            }
        }

        this.queueEvents.clear();
        this.queues.clear();
    }
}