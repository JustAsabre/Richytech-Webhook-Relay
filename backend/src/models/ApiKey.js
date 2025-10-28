/**
 * API Key Model
 * Stores hashed API keys for authentication
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const apiKeySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'API key name is required'],
      trim: true,
    },
    key: {
      type: String,
      required: true,
      unique: true,
      select: false, // Don't include in queries by default
    },
    prefix: {
      type: String,
      required: true,
      index: true,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
apiKeySchema.index({ userId: 1, isActive: 1 });
apiKeySchema.index({ prefix: 1 });
apiKeySchema.index({ createdAt: -1 });

/**
 * Generate a new API key
 * Format: rty_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 * @returns {string} Plain text API key (only shown once)
 */
/**
 * Generate a new API key
 * @returns {string} Random API key with environment prefix
 */
apiKeySchema.statics.generateKeyString = function () {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const environment = process.env.NODE_ENV === 'production' ? 'live' : 'test';
  return `rty_${environment}_${randomBytes}`;
};

/**
 * Create and save new API key document
 * @param {string} userId - User ID
 * @param {string} name - Key name
 * @param {string} description - Key description
 * @param {boolean} isProduction - Production environment flag
 * @returns {Object} { key: plainTextKey, apiKey: savedDocument }
 */
apiKeySchema.statics.generateKey = async function (userId, name, description, isProduction = false) {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const environment = isProduction ? 'live' : 'test';
  const key = `rty_${environment}_${randomBytes}`;
  const prefix = this.extractPrefix(key);

  const apiKey = await this.create({
    userId,
    name,
    description,
    key, // Will be hashed by pre-save hook
    prefix,
  });

  return { key, apiKey };
};

/**
 * Extract prefix from API key
 * @param {string} key - Full API key
 * @returns {string} First 12 characters
 */
apiKeySchema.statics.extractPrefix = function (key) {
  return key.substring(0, 12);
};

/**
 * Hash API key before saving
 */
apiKeySchema.pre('save', async function (next) {
  if (!this.isModified('key')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.key = await bcrypt.hash(this.key, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare plain text key with hashed key
 * @param {string} candidateKey - Plain text API key
 * @returns {boolean}
 */
apiKeySchema.methods.compareKey = async function (candidateKey) {
  try {
    return await bcrypt.compare(candidateKey, this.key);
  } catch (error) {
    throw new Error('API key comparison failed');
  }
};

/**
 * Update last used timestamp
 */
apiKeySchema.methods.updateLastUsed = async function () {
  this.lastUsedAt = new Date();
  await this.save();
};

const ApiKey = mongoose.model('ApiKey', apiKeySchema);

module.exports = ApiKey;
