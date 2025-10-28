/**
 * Webhook Controller
 * Handles incoming webhooks and queues them for processing
 */

const Endpoint = require('../models/Endpoint');
const WebhookLog = require('../models/WebhookLog');
const User = require('../models/User');
const logger = require('../utils/logger');
const { formatSuccess, formatError } = require('../utils/helpers');
const { ERROR_CODES, HTTP_STATUS, WEBHOOK_QUOTA } = require('../config/constants');
const webhookQueue = require('../services/webhookQueue');

/**
 * @desc    Receive webhook from external service
 * @route   POST /webhook/:userId/:endpointId
 * @access  Public (validates endpoint exists and user has quota)
 */
const receiveWebhook = async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    const { userId, endpointId } = req.params;
    const payload = req.body;
    const headers = req.headers;

    // Log incoming webhook
    logger.info('Webhook received', {
      userId,
      endpointId,
      contentType: headers['content-type'],
      payloadSize: JSON.stringify(payload).length,
      ip: req.ip,
    });

    // 1. Validate user exists and is active
    const user = await User.findOne({ _id: userId, isActive: true });
    if (!user) {
      logger.warn('Webhook rejected - User not found or inactive', { userId });
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        formatError(ERROR_CODES.NOT_FOUND, 'Invalid webhook URL')
      );
    }

    // 2. Validate endpoint exists and is active
    const endpoint = await Endpoint.findOne({
      _id: endpointId,
      userId,
      isActive: true,
    }).select('+secret'); // Include secret for webhook signing

    if (!endpoint) {
      logger.warn('Webhook rejected - Endpoint not found or inactive', {
        userId,
        endpointId,
      });
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        formatError(ERROR_CODES.NOT_FOUND, 'Invalid webhook URL')
      );
    }

    // 3. Check user quota (monthly webhook limit)
    if (!user.hasQuotaRemaining()) {
      logger.warn('Webhook rejected - Quota exceeded', {
        userId,
        currentUsage: user.currentMonthWebhooks,
        quota: WEBHOOK_QUOTA[user.subscriptionTier],
      });
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        formatError(
          ERROR_CODES.QUOTA_EXCEEDED,
          `Monthly webhook quota exceeded. Your ${user.subscriptionTier} tier allows ${
            WEBHOOK_QUOTA[user.subscriptionTier]
          } webhooks per month.`
        )
      );
    }

    // 4. Create webhook log entry
    const webhookLog = await WebhookLog.create({
      userId,
      endpointId,
      incomingPayload: payload, // Changed from 'payload' to 'incomingPayload' to match model
      headers: {
        'content-type': headers['content-type'],
        'user-agent': headers['user-agent'],
        'x-forwarded-for': headers['x-forwarded-for'],
        // Include any custom headers that might be useful
        ...Object.keys(headers)
          .filter(key => key.startsWith('x-'))
          .reduce((obj, key) => {
            obj[key] = headers[key];
            return obj;
          }, {}),
      },
      status: 'pending',
      retryCount: 0,
    });

    // 5. Increment user's webhook usage
    await user.incrementWebhookUsage();

    // 6. Queue webhook for processing
    await webhookQueue.add(
      'process-webhook',
      {
        webhookLogId: webhookLog._id.toString(),
        endpointId: endpoint._id.toString(),
        userId: user._id.toString(),
        destinationUrl: endpoint.destinationUrl,
        payload,
        secret: endpoint.secret,
        customHeaders: endpoint.customHeaders,
        retryConfig: endpoint.retryConfig,
      },
      {
        attempts: endpoint.retryConfig.maxRetries + 1, // Initial attempt + retries
        backoff: {
          type: 'fixed',
          delay: 0, // Process immediately, retries handled by our logic
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 500, // Keep last 500 failed jobs for debugging
      }
    );

    const processingTime = Date.now() - startTime;

    logger.info('Webhook queued successfully', {
      userId,
      endpointId,
      webhookLogId: webhookLog._id,
      processingTime,
    });

    // 7. Return success immediately (async processing)
    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        {
          webhookId: webhookLog._id,
          status: 'queued',
          message: 'Webhook received and queued for processing',
        },
        'Webhook accepted'
      )
    );
  } catch (error) {
    logger.error('Error receiving webhook:', error);
    
    // Log failed webhook attempt if we have the IDs
    if (req.params.userId && req.params.endpointId) {
      try {
        await WebhookLog.create({
          userId: req.params.userId,
          endpointId: req.params.endpointId,
          incomingPayload: req.body, // Changed from 'payload' to 'incomingPayload'
          headers: req.headers,
          status: 'failed',
          attempts: [{
            attemptNumber: 1,
            timestamp: new Date(),
            success: false,
            errorMessage: error.message,
          }],
        });
      } catch (logError) {
        logger.error('Error creating failed webhook log:', logError);
      }
    }
    
    next(error);
  }
};

/**
 * @desc    Get webhook delivery details
 * @route   GET /api/webhooks/:id
 * @access  Private
 */
const getWebhook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const webhook = await WebhookLog.findOne({
      _id: id,
      userId,
    }).populate('endpointId', 'name destinationUrl');

    if (!webhook) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        formatError(ERROR_CODES.NOT_FOUND, 'Webhook not found')
      );
    }

    res.status(HTTP_STATUS.OK).json(formatSuccess(webhook));
  } catch (error) {
    logger.error('Error getting webhook:', error);
    next(error);
  }
};

/**
 * @desc    List webhooks with filtering and pagination
 * @route   GET /api/webhooks
 * @access  Private
 */
const listWebhooks = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      endpointId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = { userId };

    if (endpointId) {
      filter.endpointId = endpointId;
    }

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [webhooks, total] = await Promise.all([
      WebhookLog.find(filter)
        .populate('endpointId', 'name destinationUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      WebhookLog.countDocuments(filter),
    ]);

    res.status(HTTP_STATUS.OK).json(
      formatSuccess({
        webhooks,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      })
    );
  } catch (error) {
    logger.error('Error listing webhooks:', error);
    next(error);
  }
};

/**
 * @desc    Retry failed webhook
 * @route   POST /api/webhooks/:id/retry
 * @access  Private
 */
const retryWebhook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const webhook = await WebhookLog.findOne({
      _id: id,
      userId,
    });

    if (!webhook) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        formatError(ERROR_CODES.NOT_FOUND, 'Webhook not found')
      );
    }

    if (webhook.status === 'success') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatError(
          ERROR_CODES.VALIDATION_ERROR,
          'Webhook already delivered successfully'
        )
      );
    }

    // Get endpoint for retry config
    const endpoint = await Endpoint.findById(webhook.endpointId).select('+secret');
    if (!endpoint) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        formatError(ERROR_CODES.NOT_FOUND, 'Endpoint not found')
      );
    }

    // Reset webhook status and re-queue
    webhook.status = 'pending';
    await webhook.save();

    await webhookQueue.add(
      'process-webhook',
      {
        webhookLogId: webhook._id.toString(),
        endpointId: endpoint._id.toString(),
        userId: userId.toString(),
        destinationUrl: endpoint.destinationUrl,
        payload: webhook.incomingPayload, // Changed from webhook.payload
        secret: endpoint.secret,
        customHeaders: endpoint.customHeaders,
        retryConfig: endpoint.retryConfig,
        isManualRetry: true,
      },
      {
        attempts: 1, // Manual retry, single attempt
        removeOnComplete: 100,
        removeOnFail: 500,
      }
    );

    logger.info('Webhook manually retried', {
      userId,
      webhookId: id,
      endpointId: endpoint._id,
    });

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        {
          webhookId: webhook._id,
          status: 'queued',
        },
        'Webhook queued for retry'
      )
    );
  } catch (error) {
    logger.error('Error retrying webhook:', error);
    next(error);
  }
};

module.exports = {
  receiveWebhook,
  getWebhook,
  listWebhooks,
  retryWebhook,
};
