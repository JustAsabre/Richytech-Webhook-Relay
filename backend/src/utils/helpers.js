/**
 * Helper Utilities
 * Common helper functions used throughout the application
 */

/**
 * Format error response
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @param {Array} details - Additional error details
 * @returns {Object} Formatted error response
 */
const formatError = (code, message, details = []) => {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
};

/**
 * Format success response
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @returns {Object} Formatted success response
 */
const formatSuccess = (data, message = null) => {
  const response = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  return response;
};

/**
 * Paginate results
 * @param {Object} query - Mongoose query
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
const paginate = (page = 1, limit = 20) => {
  const currentPage = Math.max(1, parseInt(page));
  const itemsPerPage = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (currentPage - 1) * itemsPerPage;

  return {
    page: currentPage,
    limit: itemsPerPage,
    skip,
  };
};

/**
 * Calculate pagination metadata
 * @param {number} total - Total items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
const getPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Sanitize object by removing sensitive fields
 * @param {Object} obj - Object to sanitize
 * @param {Array} fieldsToRemove - Fields to remove
 * @returns {Object} Sanitized object
 */
const sanitizeObject = (obj, fieldsToRemove = ['password', 'secret', 'key']) => {
  const sanitized = { ...obj };
  
  fieldsToRemove.forEach((field) => {
    delete sanitized[field];
  });

  return sanitized;
};

/**
 * Convert object to plain object (useful for Mongoose documents)
 * @param {Object} obj - Object to convert
 * @returns {Object} Plain object
 */
const toPlainObject = (obj) => {
  if (obj && typeof obj.toObject === 'function') {
    return obj.toObject();
  }
  return obj;
};

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Bytes to format
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted string
 */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Mask sensitive string (e.g., API key)
 * @param {string} str - String to mask
 * @param {number} visibleChars - Number of characters to show at start
 * @returns {string} Masked string
 */
const maskString = (str, visibleChars = 12) => {
  if (!str || str.length <= visibleChars) return str;
  return str.substring(0, visibleChars) + '•'.repeat(Math.min(str.length - visibleChars, 20));
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
const isValidUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Generate random string
 * @param {number} length - Length of string
 * @returns {string}
 */
const randomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Deep merge objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
const deepMerge = (target, source) => {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  
  return output;
};

/**
 * Check if value is an object
 * @param {*} item - Item to check
 * @returns {boolean}
 */
const isObject = (item) => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

/**
 * Truncate string with ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string}
 */
const truncate = (str, maxLength = 50) => {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
};

module.exports = {
  formatError,
  formatSuccess,
  paginate,
  getPaginationMeta,
  sanitizeObject,
  toPlainObject,
  sleep,
  formatBytes,
  maskString,
  isValidEmail,
  isValidUrl,
  randomString,
  deepMerge,
  isObject,
  truncate,
};
