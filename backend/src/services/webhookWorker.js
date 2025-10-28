/**
 * Webhook Worker
 * Processes webhooks from Bull queue and forwards them to destinations
 * Implements retry logic with exponential backoff
 */

require('dotenv').config();
const axios = require('axios');
const connectDB = require('../config/database');
const WebhookLog = require('../models/WebhookLog');
const Endpoint = require('../models/Endpoint');
const User = require('../models/User');
const logger = require('../utils/logger');
const { generateWebhookSignature } = require('./cryptoService');
const webhookQueue = require('./webhookQueue');

// Connect to MongoDB before processing webhooks
connectDB();

/**
 * Process webhook job
 * Forwards webhook to destination with HMAC signature
 */
const processWebhook = async (job) => {
  const {
    webhookLogId,
    endpointId,
    userId,
    destinationUrl,
    payload,
    secret,
    customHeaders,
    retryConfig,
    isManualRetry = false,
  } = job.data;

  const startTime = Date.now();
  let webhookLog;
  let endpoint;

  try {
    // Get webhook log and endpoint
    [webhookLog, endpoint] = await Promise.all([
      WebhookLog.findById(webhookLogId),
      Endpoint.findById(endpointId),
    ]);

    if (!webhookLog) {
      logger.error('Webhook log not found', { webhookLogId });
      return { success: false, error: 'Webhook log not found' };
    }

    if (!endpoint) {
      logger.error('Endpoint not found', { endpointId });
      webhookLog.status = 'failed';
      await webhookLog.addAttempt(false, 'Endpoint not found');
      await webhookLog.save();
      return { success: false, error: 'Endpoint not found' };
    }

    // Check if webhook should be retried
    if (!isManualRetry && webhookLog.status === 'success') {
      logger.info('Webhook already delivered successfully', { webhookLogId });
      return { success: true, alreadyDelivered: true };
    }

    // Calculate attempt number
    const attemptNumber = webhookLog.attempts.length + 1;

    logger.info('Processing webhook', {
      webhookLogId,
      endpointId,
      destinationUrl,
      attemptNumber,
      maxRetries: retryConfig.maxRetries,
    });

    // Generate HMAC signature
    const timestamp = Date.now();
    const signature = generateWebhookSignature(payload, secret, timestamp);

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Richytech-Webhook-Relay/1.0',
      'X-Webhook-Signature': signature,
      'X-Webhook-Timestamp': timestamp.toString(),
      'X-Webhook-ID': webhookLogId,
      'X-Webhook-Attempt': attemptNumber.toString(),
    };

    // Add custom headers from endpoint configuration
    if (customHeaders && customHeaders.size > 0) {
      for (const [key, value] of customHeaders) {
        headers[key] = value;
      }
    }

    // Send webhook to destination
    const response = await axios.post(destinationUrl, payload, {
      headers,
      timeout: 30000, // 30 second timeout
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 300, // Only 2xx is success
    });

    const responseTime = Date.now() - startTime;

    // Log successful attempt
    await webhookLog.addAttempt(
      true,
      null,
      response.status,
      response.headers,
      responseTime
    );

    // Update webhook log status
    webhookLog.status = 'success';
    await webhookLog.save();

    // Update endpoint statistics
    await endpoint.incrementStats(true, responseTime);

    logger.info('Webhook delivered successfully', {
      webhookLogId,
      endpointId,
      destinationUrl,
      attemptNumber,
      responseTime,
      statusCode: response.status,
    });

    return {
      success: true,
      attemptNumber,
      responseTime,
      statusCode: response.status,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error.response
      ? `HTTP ${error.response.status}: ${error.response.statusText}`
      : error.message;

    const statusCode = error.response ? error.response.status : null;

    logger.error('Webhook delivery failed', {
      webhookLogId,
      endpointId,
      destinationUrl,
      error: errorMessage,
      statusCode,
      responseTime,
    });

    // Log failed attempt
    if (webhookLog) {
      await webhookLog.addAttempt(
        false,
        errorMessage,
        statusCode,
        error.response?.headers,
        responseTime
      );

      // Check if we should retry
      const shouldRetry = webhookLog.shouldRetry(retryConfig.maxRetries);

      if (shouldRetry) {
        // Calculate delay for next retry
        const retryCount = webhookLog.retryCount;
        const retryDelay =
          retryConfig.retryIntervals[retryCount] ||
          retryConfig.retryIntervals[retryConfig.retryIntervals.length - 1];

        webhookLog.status = 'retrying';
        webhookLog.nextRetryAt = new Date(Date.now() + retryDelay);
        await webhookLog.save();

        // Update endpoint statistics (failed attempt)
        if (endpoint) {
          await endpoint.incrementStats(false, responseTime);
        }

        // Schedule retry
        await webhookQueue.add(
          'process-webhook',
          job.data,
          {
            delay: retryDelay,
            attempts: 1,
            removeOnComplete: 100,
            removeOnFail: 500,
          }
        );

        logger.info('Webhook scheduled for retry', {
          webhookLogId,
          retryCount: retryCount + 1,
          retryDelay,
          nextRetryAt: webhookLog.nextRetryAt,
        });

        return {
          success: false,
          retry: true,
          retryDelay,
          attempts: webhookLog.attempts.length,
        };
      } else {
        // Max retries reached
        webhookLog.status = 'failed';
        await webhookLog.save();

        // Update endpoint statistics (failed)
        if (endpoint) {
          await endpoint.incrementStats(false, responseTime);
        }

        // TODO: Send email notification to user about failed webhook
        logger.warn('Webhook failed after max retries', {
          webhookLogId,
          endpointId,
          destinationUrl,
          attempts: webhookLog.attempts.length,
        });

        return {
          success: false,
          maxRetriesReached: true,
          attempts: webhookLog.attempts.length,
        };
      }
    }

    throw error; // Re-throw if we couldn't handle it
  }
};

// Register the processor
webhookQueue.process('process-webhook', 5, processWebhook); // Process up to 5 concurrent webhooks

logger.info('Webhook worker started', {
  concurrency: 5,
  redisHost: process.env.REDIS_HOST,
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down webhook worker...');
  await webhookQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down webhook worker...');
  await webhookQueue.close();
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception in webhook worker:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection in webhook worker:', { reason, promise });
  process.exit(1);
});

module.exports = { processWebhook };
