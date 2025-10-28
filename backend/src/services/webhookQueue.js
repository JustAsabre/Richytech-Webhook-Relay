/**
 * Webhook Queue Service
 * Bull queue for processing webhooks asynchronously
 */

const Queue = require('bull');
const Redis = require('ioredis');
const logger = require('../utils/logger');

// Create webhook processing queue with custom Redis client
// Using createClient pattern to ensure proper Redis Cloud connection
const webhookQueue = new Queue('webhook-processing', {
  createClient: function (type) {
    logger.debug(`Creating ${type} Redis connection for webhook queue`);
    return new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null, // Important for Bull
      enableReadyCheck: false, // Important for Bull
    });
  },
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500, // Keep last 500 failed jobs
  },
});

// Queue event listeners for monitoring
webhookQueue.on('error', (error) => {
  logger.error('Webhook queue error:', error);
});

webhookQueue.on('waiting', (jobId) => {
  logger.debug('Webhook job waiting:', { jobId });
});

webhookQueue.on('active', (job) => {
  logger.info('Processing webhook job:', {
    jobId: job.id,
    webhookLogId: job.data.webhookLogId,
    endpointId: job.data.endpointId,
  });
});

webhookQueue.on('completed', (job, result) => {
  logger.info('Webhook job completed:', {
    jobId: job.id,
    webhookLogId: job.data.webhookLogId,
    success: result.success,
    attempts: result.attempts,
  });
});

webhookQueue.on('failed', (job, err) => {
  logger.error('Webhook job failed:', {
    jobId: job.id,
    webhookLogId: job.data.webhookLogId,
    error: err.message,
    attemptsMade: job.attemptsMade,
  });
});

webhookQueue.on('stalled', (job) => {
  logger.warn('Webhook job stalled:', {
    jobId: job.id,
    webhookLogId: job.data.webhookLogId,
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing webhook queue...');
  await webhookQueue.close();
});

module.exports = webhookQueue;
