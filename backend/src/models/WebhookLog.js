/**
 * Webhook Log Model
 * Stores webhook delivery attempts and responses
 */

const mongoose = require('mongoose');
const { WEBHOOK_STATUS, LOG_RETENTION } = require('../config/constants');

const webhookLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    endpointId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Endpoint',
      required: true,
      index: true,
    },
    // Incoming webhook data
    incomingPayload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    incomingHeaders: {
      type: Map,
      of: String,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    // Delivery attempts
    attempts: [
      {
        attemptNumber: {
          type: Number,
          required: true,
        },
        attemptedAt: {
          type: Date,
          default: Date.now,
        },
        requestHeaders: {
          type: Map,
          of: String,
        },
        responseStatus: {
          type: Number,
        },
        responseBody: {
          type: String,
          maxlength: 10000, // Limit response body size
        },
        responseTime: {
          type: Number, // in milliseconds
        },
        errorMessage: {
          type: String,
        },
        success: {
          type: Boolean,
          default: false,
        },
      },
    ],
    // Status
    status: {
      type: String,
      enum: Object.values(WEBHOOK_STATUS),
      default: WEBHOOK_STATUS.PENDING,
      index: true,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    lastAttemptAt: {
      type: Date,
    },
    nextRetryAt: {
      type: Date,
    },
    // TTL for automatic deletion based on subscription tier
    expiresAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
webhookLogSchema.index({ userId: 1, createdAt: -1 });
webhookLogSchema.index({ userId: 1, status: 1 });
webhookLogSchema.index({ endpointId: 1, createdAt: -1 });
webhookLogSchema.index({ status: 1, nextRetryAt: 1 });
webhookLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

/**
 * Pre-save hook to set expiration date based on user's subscription tier
 */
webhookLogSchema.pre('save', async function (next) {
  if (this.isNew && !this.expiresAt) {
    try {
      const User = mongoose.model('User');
      const user = await User.findById(this.userId);
      
      if (user) {
        const retentionDays = LOG_RETENTION[user.subscriptionTier] || LOG_RETENTION.free;
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + retentionDays);
        this.expiresAt = expirationDate;
      }
    } catch (error) {
      console.error('Error setting expiration date:', error);
    }
  }
  next();
});

/**
 * Add a delivery attempt to the log
 * @param {Object} attemptData - Attempt details
 */
webhookLogSchema.methods.addAttempt = async function (attemptData) {
  this.attempts.push({
    attemptNumber: this.retryCount + 1,
    attemptedAt: new Date(),
    ...attemptData,
  });

  this.retryCount += 1;
  this.lastAttemptAt = new Date();

  // Update status based on attempt result
  if (attemptData.success) {
    this.status = WEBHOOK_STATUS.SUCCESS;
    this.nextRetryAt = null;
  } else {
    // Calculate next retry time if not max retries
    const endpoint = await mongoose.model('Endpoint').findById(this.endpointId);
    if (endpoint && this.retryCount < endpoint.retryConfig.maxRetries) {
      const retryInterval = endpoint.retryConfig.retryIntervals[this.retryCount];
      if (retryInterval !== undefined) {
        this.nextRetryAt = new Date(Date.now() + retryInterval);
        this.status = WEBHOOK_STATUS.PENDING;
      } else {
        this.status = WEBHOOK_STATUS.FAILED;
        this.nextRetryAt = null;
      }
    } else {
      this.status = WEBHOOK_STATUS.FAILED;
      this.nextRetryAt = null;
    }
  }

  await this.save();
};

/**
 * Get the last attempt
 * @returns {Object} Last attempt data
 */
webhookLogSchema.methods.getLastAttempt = function () {
  if (this.attempts.length === 0) return null;
  return this.attempts[this.attempts.length - 1];
};

/**
 * Check if webhook should be retried
 * @returns {boolean}
 */
webhookLogSchema.methods.shouldRetry = function () {
  return (
    this.status === WEBHOOK_STATUS.PENDING &&
    this.nextRetryAt &&
    new Date() >= this.nextRetryAt
  );
};

// Virtual for total response time
webhookLogSchema.virtual('totalResponseTime').get(function () {
  return this.attempts.reduce((sum, attempt) => sum + (attempt.responseTime || 0), 0);
});

// Virtual for average response time
webhookLogSchema.virtual('avgResponseTime').get(function () {
  if (this.attempts.length === 0) return 0;
  return Math.round(this.totalResponseTime / this.attempts.length);
});

// Ensure virtuals are included in JSON
webhookLogSchema.set('toJSON', { virtuals: true });
webhookLogSchema.set('toObject', { virtuals: true });

const WebhookLog = mongoose.model('WebhookLog', webhookLogSchema);

module.exports = WebhookLog;
