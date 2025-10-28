/**
 * Crypto Service
 * Handles encryption, HMAC signing, and key generation
 */

const crypto = require('crypto');

/**
 * Generate HMAC signature for webhook payload
 * @param {Object} payload - Webhook payload
 * @param {string} secret - HMAC secret
 * @returns {string} HMAC signature (hex)
 */
const generateWebhookSignature = (payload, secret) => {
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  
  return crypto
    .createHmac('sha256', secret)
    .update(payloadString)
    .digest('hex');
};

/**
 * Verify webhook signature
 * @param {Object} payload - Webhook payload
 * @param {string} signature - Provided signature
 * @param {string} secret - HMAC secret
 * @returns {boolean} Whether signature is valid
 */
const verifyWebhookSignature = (payload, signature, secret) => {
  const expectedSignature = generateWebhookSignature(payload, secret);
  
  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
};

/**
 * Generate random API key
 * @param {number} length - Length of random portion (default 32)
 * @returns {string} API key
 */
const generateApiKey = (length = 32) => {
  const randomBytes = crypto.randomBytes(length).toString('hex');
  const environment = process.env.NODE_ENV === 'production' ? 'live' : 'test';
  return `rty_${environment}_${randomBytes}`;
};

/**
 * Generate random secret
 * @param {number} length - Byte length (default 32)
 * @returns {string} Random hex string
 */
const generateSecret = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate random token for email verification/password reset
 * @returns {string} Random token
 */
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash token for storage
 * @param {string} token - Token to hash
 * @returns {string} Hashed token
 */
const hashToken = (token) => {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
};

module.exports = {
  generateWebhookSignature,
  verifyWebhookSignature,
  generateApiKey,
  generateSecret,
  generateToken,
  hashToken,
};
