import { JobsOptions } from 'bullmq';

/**
 * Queue names enum for type safety
 */
export enum QueueName {
    MEETING_PROCESSING = 'meeting-processing',
    EMAIL_SENDING = 'email-sending',
    EXTERNAL_API = 'external-api',
    SCHEDULED_TASKS = 'scheduled-tasks',
}

/**
 * Job types for different queues
 */
export enum JobType {
    // Meeting processing jobs
    PROCESS_MEETING_RECORD = 'process-meeting-record',
    ANALYZE_MEETING_CONTENT = 'analyze-meeting-content',
    SYNC_MEETING_DATA = 'sync-meeting-data',

    // Email jobs
    SEND_VERIFICATION_EMAIL = 'send-verification-email',
    SEND_PASSWORD_RESET_EMAIL = 'send-password-reset-email',
    SEND_NOTIFICATION_EMAIL = 'send-notification-email',

    // External API jobs
    UPLOAD_RECORDING = 'upload-recording',
    SYNC_TENCENT_MEETING = 'sync-tencent-meeting',
    SYNC_LARK_BITABLE = 'sync-lark-bitable',
    SEND_SMS = 'send-sms',

    // Scheduled tasks
    CLEANUP_EXPIRED_TOKENS = 'cleanup-expired-tokens',
    GENERATE_REPORTS = 'generate-reports',
    HEALTH_CHECK = 'health-check',
}

/**
 * Base job data interface
 */
export interface BaseJobData {
    idempotencyKey: string;
    userId?: string;
    correlationId?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
}

/**
 * Meeting processing job data
 */
export interface MeetingProcessingJobData extends BaseJobData {
    meetingId: string;
    action: 'process' | 'analyze' | 'sync';
    payload: {
        meetingData?: any;
        analysisType?: string;
        syncTarget?: string;
    };
}

/**
 * Email job data
 */
export interface EmailJobData extends BaseJobData {
    to: string | string[];
    subject: string;
    template: string;
    templateData: Record<string, any>;
    priority?: 'low' | 'normal' | 'high';
}

/**
 * External API job data
 */
export interface ExternalApiJobData extends BaseJobData {
    service: 'tencent-meeting' | 'lark' | 'aliyun-sms' | 'upload';
    action: string;
    payload: Record<string, any>;
    retryConfig?: {
        maxAttempts?: number;
        backoffDelay?: number;
    };
}

/**
 * Scheduled task job data
 */
export interface ScheduledTaskJobData extends BaseJobData {
    taskType: string;
    config: Record<string, any>;
}

/**
 * Job options with defaults
 */
export interface QueueJobOptions extends Omit<JobsOptions, 'jobId'> {
    priority?: number;
    delay?: number;
    attempts?: number;
    backoff?: {
        type: 'fixed' | 'exponential';
        delay: number;
    };
    removeOnComplete?: number;
    removeOnFail?: number;
}

/**
 * Default job options for different job types
 */
export const DEFAULT_JOB_OPTIONS: Record<JobType, QueueJobOptions> = {
    // Meeting processing jobs
    [JobType.PROCESS_MEETING_RECORD]: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 50,
        removeOnFail: 20,
    },
    [JobType.ANALYZE_MEETING_CONTENT]: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: 30,
        removeOnFail: 10,
    },
    [JobType.SYNC_MEETING_DATA]: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: 100,
        removeOnFail: 50,
    },

    // Email jobs
    [JobType.SEND_VERIFICATION_EMAIL]: {
        attempts: 3,
        backoff: { type: 'fixed', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
        priority: 5,
    },
    [JobType.SEND_PASSWORD_RESET_EMAIL]: {
        attempts: 3,
        backoff: { type: 'fixed', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
        priority: 10,
    },
    [JobType.SEND_NOTIFICATION_EMAIL]: {
        attempts: 2,
        backoff: { type: 'fixed', delay: 5000 },
        removeOnComplete: 50,
        removeOnFail: 20,
        priority: 1,
    },

    // External API jobs
    [JobType.UPLOAD_RECORDING]: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: 20,
        removeOnFail: 10,
    },
    [JobType.SYNC_TENCENT_MEETING]: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 50,
        removeOnFail: 20,
    },
    [JobType.SYNC_LARK_BITABLE]: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 50,
        removeOnFail: 20,
    },
    [JobType.SEND_SMS]: {
        attempts: 2,
        backoff: { type: 'fixed', delay: 3000 },
        removeOnComplete: 100,
        removeOnFail: 50,
        priority: 8,
    },

    // Scheduled tasks
    [JobType.CLEANUP_EXPIRED_TOKENS]: {
        attempts: 2,
        backoff: { type: 'fixed', delay: 30000 },
        removeOnComplete: 10,
        removeOnFail: 5,
    },
    [JobType.GENERATE_REPORTS]: {
        attempts: 1,
        backoff: { type: 'fixed', delay: 60000 },
        removeOnComplete: 5,
        removeOnFail: 5,
    },
    [JobType.HEALTH_CHECK]: {
        attempts: 1,
        removeOnComplete: 1,
        removeOnFail: 1,
    },
};

/**
 * Job status tracking
 */
export enum JobStatus {
    WAITING = 'waiting',
    ACTIVE = 'active',
    COMPLETED = 'completed',
    FAILED = 'failed',
    DELAYED = 'delayed',
    PAUSED = 'paused',
}

/**
 * Queue metrics interface
 */
export interface QueueMetrics {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
}

/**
 * Job result interface
 */
export interface JobResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: Date;
    duration: number;
}