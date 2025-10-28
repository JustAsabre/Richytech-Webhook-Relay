/**
 * API Key Validation Middleware
 * Validates API keys for webhook endpoints and API access
 */

const { ApiKey, User } = require('../models');
const { formatError } = require('../utils/helpers');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Validate API key from request header
 * Attaches user to request if valid
 */
const validateApiKey = async (req, res, next) => {
  try {
    let apiKey;

    // Check for API key in Authorization header (Bearer token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      apiKey = req.headers.authorization.split(' ')[1];
    }
    // Check for API key in x-api-key header
    else if (req.headers['x-api-key']) {
      apiKey = req.headers['x-api-key'];
    }

    // Check if API key exists
    if (!apiKey) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        formatError(
          ERROR_CODES.INVALID_API_KEY,
          'API key required. Please provide your API key in the Authorization header or x-api-key header.'
        )
      );
    }

    // Validate API key format (should start with rty_)
    if (!apiKey.startsWith('rty_')) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        formatError(
          ERROR_CODES.INVALID_API_KEY,
          'Invalid API key format'
        )
      );
    }

    try {
      // Extract prefix to find potential matches
      const prefix = apiKey.substring(0, 12);

      // Find API keys with matching prefix
      const apiKeyDoc = await ApiKey.findOne({ prefix, isActive: true })
        .select('+key')
        .populate('userId');

      if (!apiKeyDoc) {
        logger.warn(`Invalid API key attempt with prefix: ${prefix}`);
        return res.status(HTTP_STATUS.UNAUTHORIZED).json(
          formatError(
            ERROR_CODES.INVALID_API_KEY,
            'Invalid API key'
          )
        );
      }

      // Compare the full API key
      const isMatch = await apiKeyDoc.compareKey(apiKey);

      if (!isMatch) {
        logger.warn(`API key mismatch for prefix: ${prefix}`);
        return res.status(HTTP_STATUS.UNAUTHORIZED).json(
          formatError(
            ERROR_CODES.INVALID_API_KEY,
            'Invalid API key'
          )
        );
      }

      // Check if user exists and is active
      const user = await User.findById(apiKeyDoc.userId);

      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json(
          formatError(
            ERROR_CODES.INVALID_API_KEY,
            'User associated with API key no longer exists'
          )
        );
      }

      if (!user.isActive) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json(
          formatError(
            ERROR_CODES.AUTHORIZATION_ERROR,
            'Your account has been deactivated. Please contact support.'
          )
        );
      }

      // Update last used timestamp (async, don't wait)
      apiKeyDoc.updateLastUsed().catch((err) => {
        logger.error(`Failed to update API key last used: ${err.message}`);
      });

      // Attach user and API key to request
      req.user = user;
      req.apiKey = apiKeyDoc;

      next();
    } catch (error) {
      logger.error(`API key validation error: ${error.message}`);
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        formatError(
          ERROR_CODES.INVALID_API_KEY,
          'API key validation failed'
        )
      );
    }
  } catch (error) {
    logger.error(`API key middleware error: ${error.message}`);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatError(ERROR_CODES.INTERNAL_ERROR, 'Authentication error')
    );
  }
};

/**
 * Optional API key validation
 * Continues even if no API key provided, but validates if present
 */
const optionalApiKey = async (req, res, next) => {
  const hasApiKey = 
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) ||
    req.headers['x-api-key'];

  if (hasApiKey) {
    return validateApiKey(req, res, next);
  }

  next();
};

module.exports = {
  validateApiKey,
  optionalApiKey,
};
