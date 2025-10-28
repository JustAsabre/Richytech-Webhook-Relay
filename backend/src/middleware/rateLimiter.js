/**
 * Rate Limiter Middleware
 * Protects endpoints from abuse with tier-based limits
 */

const rateLimit = require('express-rate-limit');
const { formatError } = require('../utils/helpers');
const { HTTP_STATUS, ERROR_CODES, RATE_LIMITS } = require('../config/constants');

/**
 * General API rate limiter (for non-webhook endpoints)
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: formatError(
    ERROR_CODES.RATE_LIMIT_EXCEEDED,
    'Too many requests from this IP, please try again later'
  ),
  handler: (req, res) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(
      formatError(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Too many requests, please try again later'
      )
    );
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 5, // Higher limit in development for testing
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: formatError(
    ERROR_CODES.RATE_LIMIT_EXCEEDED,
    'Too many login attempts, please try again after 15 minutes'
  ),
  handler: (req, res) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(
      formatError(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Too many authentication attempts, please try again after 15 minutes'
      )
    );
  },
});

/**
 * Dynamic webhook rate limiter based on subscription tier
 * Enforces per-endpoint limits
 */
const webhookLimiter = (req, res, next) => {
  // Get user from request (set by previous middleware)
  const user = req.user;

  if (!user) {
    return next();
  }

  // Get rate limit for user's tier
  const maxRequests = RATE_LIMITS[user.subscriptionTier] || RATE_LIMITS.free;

  // Create rate limiter for this tier
  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Rate limit per user + endpoint combination
      return `${req.user._id}:${req.params.endpointId}`;
    },
    handler: (req, res) => {
      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(
        formatError(
          ERROR_CODES.RATE_LIMIT_EXCEEDED,
          `Webhook rate limit exceeded. Your tier allows ${maxRequests} requests per minute per endpoint.`,
          [
            {
              tier: user.subscriptionTier,
              limit: maxRequests,
              window: '1 minute',
            },
          ]
        )
      );
    },
  });

  return limiter(req, res, next);
};

/**
 * Create custom rate limiter with specific settings
 * @param {Object} options - Rate limit options
 * @returns {Function} Rate limiter middleware
 */
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(
        formatError(
          ERROR_CODES.RATE_LIMIT_EXCEEDED,
          options.message || 'Too many requests, please try again later'
        )
      );
    },
  };

  return rateLimit({ ...defaultOptions, ...options });
};

module.exports = {
  apiLimiter,
  authLimiter,
  webhookLimiter,
  createRateLimiter,
};
