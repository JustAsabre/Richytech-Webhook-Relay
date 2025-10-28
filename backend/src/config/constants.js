/**
 * Application Constants
 * Centralized configuration constants
 */

module.exports = {
  // Subscription Tiers
  SUBSCRIPTION_TIERS: {
    FREE: 'free',
    STARTER: 'starter',
    BUSINESS: 'business',
    ENTERPRISE: 'enterprise',
  },

  // Subscription Quotas (monthly webhooks)
  WEBHOOK_QUOTAS: {
    free: 1000,
    starter: 10000,
    business: 50000,
    enterprise: Infinity,
  },

  // Endpoint Limits (max endpoints per tier)
  ENDPOINT_LIMITS: {
    free: {
      maxEndpoints: 2,
      maxApiKeys: 2,
    },
    starter: {
      maxEndpoints: 10,
      maxApiKeys: 5,
    },
    business: {
      maxEndpoints: 50,
      maxApiKeys: 20,
    },
    enterprise: {
      maxEndpoints: Infinity,
      maxApiKeys: Infinity,
    },
  },

  // Log Retention (days)
  LOG_RETENTION: {
    free: 3,
    starter: 30,
    business: 90,
    enterprise: 365,
  },

  // Rate Limits (requests per minute per endpoint)
  RATE_LIMITS: {
    free: 10,
    starter: 50,
    business: 200,
    enterprise: 1000,
  },

  // Webhook Status
  WEBHOOK_STATUS: {
    SUCCESS: 'success',
    PENDING: 'pending',
    FAILED: 'failed',
  },

  // Subscription Status
  SUBSCRIPTION_STATUS: {
    ACTIVE: 'active',
    CANCELLED: 'cancelled',
    PAST_DUE: 'past_due',
    TRIALING: 'trialing',
  },

  // User Roles
  USER_ROLES: {
    CLIENT: 'client',
    ADMIN: 'admin',
  },

  // Retry Configuration
  RETRY_CONFIG: {
    MAX_RETRIES: 6,
    INTERVALS: [
      0,           // Attempt 1: Immediate
      60000,       // Attempt 2: +1 minute
      300000,      // Attempt 3: +5 minutes
      900000,      // Attempt 4: +15 minutes
      3600000,     // Attempt 5: +1 hour
      21600000,    // Attempt 6: +6 hours
    ],
  },

  // Webhook Processing
  WEBHOOK_TIMEOUT: parseInt(process.env.WEBHOOK_TIMEOUT_MS) || 30000, // 30 seconds
  WEBHOOK_WORKER_CONCURRENCY: parseInt(process.env.WEBHOOK_WORKER_CONCURRENCY) || 10,

  // Pricing (GH₵)
  PRICING: {
    starter: 50,
    business: 150,
    enterprise: null, // Custom pricing
  },

  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
  },

  // Error Codes
  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    INVALID_API_KEY: 'INVALID_API_KEY',
    WEBHOOK_ERROR: 'WEBHOOK_ERROR',
  },

  // Email Templates
  EMAIL_TEMPLATES: {
    WELCOME: 'welcome',
    WEBHOOK_FAILURE: 'webhook_failure',
    WEEKLY_SUMMARY: 'weekly_summary',
    PASSWORD_RESET: 'password_reset',
    PAYMENT_SUCCESS: 'payment_success',
    PAYMENT_FAILED: 'payment_failed',
  },
};
