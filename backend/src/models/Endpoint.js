/**
 * Webhook Endpoint Model
 * Represents a webhook endpoint configuration
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const { RETRY_CONFIG } = require('../config/constants');

const endpointSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Endpoint name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    destinationUrl: {
      type: String,
      required: [true, 'Destination URL is required'],
      trim: true,
      validate: {
        validator: function (v) {
          // Basic URL validation
          try {
            new URL(v);
            return v.startsWith('http://') || v.startsWith('https://');
          } catch {
            return false;
          }
        },
        message: 'Please provide a valid HTTP/HTTPS URL',
      },
    },
    secret: {
      type: String,
      required: false, // Auto-generated in pre-save hook
      select: false, // Don't expose secret in queries
    },
    customHeaders: {
      type: Map,
      of: String,
      default: new Map(),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    retryConfig: {
      maxRetries: {
        type: Number,
        default: RETRY_CONFIG.MAX_RETRIES,
        min: 0,
        max: 10,
      },
      retryIntervals: {
        type: [Number],
        default: RETRY_CONFIG.INTERVALS,
      },
    },
    // Statistics
    statistics: {
      totalRequests: {
        type: Number,
        default: 0,
      },
      successfulRequests: {
        type: Number,
        default: 0,
      },
      failedRequests: {
        type: Number,
        default: 0,
      },
      lastRequestAt: {
        type: Date,
        default: null,
      },
      averageResponseTime: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
endpointSchema.index({ userId: 1, isActive: 1 });
endpointSchema.index({ userId: 1, createdAt: -1 });
endpointSchema.index({ isActive: 1 });

/**
 * Generate HMAC secret for webhook signing
 * @returns {string} Random hex string (64 characters)
 */
endpointSchema.statics.generateSecret = function () {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate webhook URL for this endpoint
 * @returns {string} Webhook URL
 */
endpointSchema.methods.getWebhookUrl = function () {
  const baseUrl = process.env.API_URL || 'http://localhost:5000';
  return `${baseUrl}/webhook/${this.userId}/${this._id}`;
};

/**
 * Calculate success rate
 * @returns {number} Success rate percentage
 */
endpointSchema.methods.getSuccessRate = function () {
  if (this.statistics.totalRequests === 0) return 100;
  return ((this.statistics.successfulRequests / this.statistics.totalRequests) * 100).toFixed(2);
};

/**
 * Increment webhook statistics
 * @param {boolean} success - Whether webhook was successful
 * @param {number} responseTime - Response time in ms
 */
endpointSchema.methods.incrementStats = async function (success, responseTime = 0) {
  this.statistics.totalRequests += 1;
  if (success) {
    this.statistics.successfulRequests += 1;
  } else {
    this.statistics.failedRequests += 1;
  }
  this.statistics.lastRequestAt = new Date();
  
  // Update average response time
  if (responseTime > 0) {
    const totalTime = this.statistics.averageResponseTime * (this.statistics.totalRequests - 1) + responseTime;
    this.statistics.averageResponseTime = Math.round(totalTime / this.statistics.totalRequests);
  }
  
  await this.save();
};

/**
 * Generate new secret
 * @returns {string} New secret
 */
endpointSchema.methods.generateSecret = function () {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Pre-save hook to generate secret if not provided
 */
endpointSchema.pre('save', function (next) {
  if (!this.secret) {
    this.secret = endpointSchema.statics.generateSecret();
  }
  next();
});

// Virtual for success rate
endpointSchema.virtual('successRate').get(function () {
  return this.getSuccessRate();
});

// Ensure virtuals are included in JSON
endpointSchema.set('toJSON', { virtuals: true });
endpointSchema.set('toObject', { virtuals: true });

const Endpoint = mongoose.model('Endpoint', endpointSchema);

module.exports = Endpoint;
