# Queue System with BullMQ + Redis

This module implements a comprehensive asynchronous task queue system using BullMQ and Redis for the LuLab backend.

## Features

- ✅ **Persistent Job Storage**: Jobs are stored in Redis for durability
- ✅ **Retry Logic**: Configurable retry strategies with exponential backoff
- ✅ **Parallel Processing**: Multiple workers can process jobs concurrently
- ✅ **Delayed Jobs**: Schedule jobs to run at specific times
- ✅ **Job Monitoring**: Real-time job status and metrics
- ✅ **Idempotency**: Prevent duplicate job execution
- ✅ **Priority Queues**: High-priority jobs get processed first
- ✅ **Error Handling**: Comprehensive error handling and reporting

## Queue Types

### 1. Meeting Processing Queue
- Process meeting records
- Analyze meeting content  
- Sync meeting data to external systems

### 2. Email Queue
- Send verification emails
- Send password reset emails
- Send notification emails
- Schedule meeting reminders

### 3. External API Queue
- Upload recordings to cloud storage
- Sync with Tencent Meeting API
- Sync with Lark Bitable
- Send SMS notifications

## Environment Variables

Add these to your `.env` file:

```env
# Redis Configuration (required)
REDIS_URL=redis://localhost:6379
# OR individual settings
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Queue Configuration (optional)
QUEUE_REMOVE_ON_COMPLETE=50
QUEUE_REMOVE_ON_FAIL=20
QUEUE_DEFAULT_ATTEMPTS=3
QUEUE_BACKOFF_DELAY=5000
QUEUE_CONCURRENCY_DEFAULT=1
QUEUE_CONCURRENCY_EMAIL=2
QUEUE_CONCURRENCY_MEETING=1
QUEUE_CONCURRENCY_EXTERNAL_API=1
QUEUE_IDEMPOTENCY_TTL=86400
QUEUE_MAX_JOB_AGE_HOURS=24
QUEUE_MAX_WAITING_JOBS=100
QUEUE_MAX_FAILED_JOBS=50
```

## Usage Examples

### Basic Job Addition

```typescript
// In your service
constructor(
  private readonly meetingQueue: MeetingQueueService,
  private readonly emailQueue: EmailQueueService,
) {}

// Add meeting processing job
await this.meetingQueue.addProcessJob('meeting-123', 'process', {
  meetingData: { title: 'Team Standup' }
});

// Send email
await this.emailQueue.sendVerificationEmail('user@example.com', {
  verificationCode: '123456',
  verificationUrl: 'https://app.example.com/verify?token=abc'
});
```

### Advanced Features

```typescript
// High priority job with delay
await this.emailQueue.sendVerificationEmail(
  'vip@example.com',
  { verificationCode: '123456' },
  { 
    priority: 'high',
    delay: 5000 // 5 second delay
  }
);

// Bulk job processing
await this.meetingQueue.addBulkProcessJobs([
  { meetingId: 'meeting-1', action: 'process', payload: {} },
  { meetingId: 'meeting-2', action: 'analyze', payload: {} },
]);

// Scheduled recurring job
await this.emailQueue.scheduleRecurringNotification(
  'admin@example.com',
  'Daily Report',
  'daily-report',
  { date: new Date() },
  '0 9 * * *' // Every day at 9 AM
);
```

## Monitoring & Administration

### Health Check
```typescript
const health = await this.queueMonitoring.getSystemHealth();
console.log('System healthy:', health.healthy);
```

### Queue Metrics
```typescript
const metrics = await this.queueMonitoring.getAllQueueMetrics();
console.log('Queue metrics:', metrics);
```

### Clean Old Jobs
```typescript
await this.queueMonitoring.cleanAllQueues({
  completedMaxAge: 24 * 60 * 60 * 1000, // 24 hours
  failedMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

## REST API Endpoints

The system provides admin endpoints for monitoring:

- `GET /admin/queues/health` - System health
- `GET /admin/queues/metrics` - All queue metrics
- `GET /admin/queues/:queueName/metrics` - Specific queue metrics
- `POST /admin/queues/clean` - Clean old jobs
- `POST /admin/queues/pause` - Pause all queues
- `POST /admin/queues/resume` - Resume all queues

## Job Structure

All jobs follow this structure:

```typescript
interface BaseJobData {
  idempotencyKey: string;    // Unique identifier for idempotency
  userId?: string;           // Associated user
  correlationId?: string;    // For tracking across services
  metadata?: object;         // Additional data
  createdAt: Date;          // Job creation time
}
```

## Error Handling

The system includes comprehensive error handling:

- **Recoverable Errors**: Jobs are retried with backoff
- **Unrecoverable Errors**: Jobs fail immediately (validation errors, etc.)
- **Job Age Limits**: Old jobs are automatically rejected
- **Dead Letter Queues**: Failed jobs are preserved for debugging

## Best Practices

1. **Idempotency**: Always provide unique `idempotencyKey` values
2. **Error Handling**: Use try-catch in job processors
3. **Monitoring**: Regularly check queue health and clean old jobs
4. **Resource Limits**: Configure appropriate concurrency limits
5. **Graceful Shutdown**: Workers are closed on module destroy

## Testing

Run the queue tests:

```bash
# Unit tests
pnpm test src/queue

# Integration tests (requires Redis)
pnpm test:integration
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Queue Service │───▶│      Redis      │◀───│     Worker      │
│                 │    │                 │    │                 │
│ - Add jobs      │    │ - Job storage   │    │ - Process jobs  │
│ - Bulk ops      │    │ - Idempotency   │    │ - Error handling│
│ - Scheduling    │    │ - Metrics       │    │ - Retry logic   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

The system is designed to be production-ready with proper error handling, monitoring, and scalability features.