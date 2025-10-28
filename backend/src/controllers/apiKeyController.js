/**
 * API Key Controller
 * Handles API key generation, listing, and revocation for authenticated users
 */

const ApiKey = require('../models/ApiKey');
const { formatSuccess, formatError } = require('../utils/helpers');
const { HTTP_STATUS, ERROR_CODES, ENDPOINT_LIMITS } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * @desc    Generate new API key
 * @route   POST /api/keys
 * @access  Private
 */
const generateKey = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const userId = req.user._id;

    // Check if user has reached their API key limit
    const existingKeysCount = await ApiKey.countDocuments({
      userId,
      isActive: true,
    });

    const maxKeys = ENDPOINT_LIMITS[req.user.subscriptionTier]?.maxApiKeys || 
                    ENDPOINT_LIMITS.free.maxApiKeys;

    if (existingKeysCount >= maxKeys) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        formatError(
          ERROR_CODES.QUOTA_EXCEEDED,
          `API key limit reached. Your ${req.user.subscriptionTier} tier allows ${maxKeys} active keys.`,
          [
            {
              tier: req.user.subscriptionTier,
              current: existingKeysCount,
              limit: maxKeys,
            },
          ]
        )
      );
    }

    // Check for duplicate name
    const existingKey = await ApiKey.findOne({
      userId,
      name,
      isActive: true,
    });

    if (existingKey) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatError(
          ERROR_CODES.VALIDATION_ERROR,
          'An API key with this name already exists'
        )
      );
    }

    // Generate the API key
    const { key, apiKey } = await ApiKey.generateKey(
      userId,
      name,
      description,
      process.env.NODE_ENV === 'production'
    );

    logger.info(`API key generated for user ${userId}`, {
      userId,
      keyId: apiKey._id,
      keyName: name,
    });

    res.status(HTTP_STATUS.CREATED).json(
      formatSuccess(
        {
          key, // Plain text key - only shown once!
          apiKey: {
            _id: apiKey._id,
            name: apiKey.name,
            description: apiKey.description,
            prefix: apiKey.prefix,
            createdAt: apiKey.createdAt,
            lastUsedAt: apiKey.lastUsedAt,
            isActive: apiKey.isActive,
          },
        },
        'API key generated successfully. Save this key - it will not be shown again!'
      )
    );
  } catch (error) {
    logger.error('Error generating API key:', error);
    next(error);
  }
};

/**
 * @desc    List all API keys for current user
 * @route   GET /api/keys
 * @access  Private
 */
const listKeys = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { includeInactive = false } = req.query;

    const filter = { userId };
    if (!includeInactive) {
      filter.isActive = true;
    }

    const apiKeys = await ApiKey.find(filter)
      .select('-key') // Never return the hashed key
      .sort({ createdAt: -1 });

    // Get count for quota display
    const activeCount = await ApiKey.countDocuments({
      userId,
      isActive: true,
    });

    const maxKeys = ENDPOINT_LIMITS[req.user.subscriptionTier]?.maxApiKeys || 
                    ENDPOINT_LIMITS.free.maxApiKeys;

    res.status(HTTP_STATUS.OK).json(
      formatSuccess({
        apiKeys,
        quota: {
          used: activeCount,
          limit: maxKeys,
          tier: req.user.subscriptionTier,
        },
      })
    );
  } catch (error) {
    logger.error('Error listing API keys:', error);
    next(error);
  }
};

/**
 * @desc    Get single API key details
 * @route   GET /api/keys/:id
 * @access  Private
 */
const getKey = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const apiKey = await ApiKey.findOne({
      _id: id,
      userId,
    }).select('-key');

    if (!apiKey) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        formatError(ERROR_CODES.NOT_FOUND, 'API key not found')
      );
    }

    res.status(HTTP_STATUS.OK).json(formatSuccess(apiKey));
  } catch (error) {
    logger.error('Error getting API key:', error);
    next(error);
  }
};

/**
 * @desc    Update API key (name and description only)
 * @route   PUT /api/keys/:id
 * @access  Private
 */
const updateKey = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user._id;

    // Check for duplicate name (excluding current key)
    if (name) {
      const duplicate = await ApiKey.findOne({
        userId,
        name,
        _id: { $ne: id },
        isActive: true,
      });

      if (duplicate) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
          formatError(
            ERROR_CODES.VALIDATION_ERROR,
            'An API key with this name already exists'
          )
        );
      }
    }

    const apiKey = await ApiKey.findOneAndUpdate(
      { _id: id, userId },
      { name, description },
      { new: true, runValidators: true }
    ).select('-key');

    if (!apiKey) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        formatError(ERROR_CODES.NOT_FOUND, 'API key not found')
      );
    }

    logger.info(`API key updated: ${apiKey._id}`, { userId, keyId: apiKey._id });

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(apiKey, 'API key updated successfully')
    );
  } catch (error) {
    logger.error('Error updating API key:', error);
    next(error);
  }
};

/**
 * @desc    Revoke (soft delete) API key
 * @route   DELETE /api/keys/:id
 * @access  Private
 */
const revokeKey = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const apiKey = await ApiKey.findOne({
      _id: id,
      userId,
    });

    if (!apiKey) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        formatError(ERROR_CODES.NOT_FOUND, 'API key not found')
      );
    }

    // Soft delete - just mark as inactive
    apiKey.isActive = false;
    await apiKey.save();

    logger.info(`API key revoked: ${apiKey._id}`, {
      userId,
      keyId: apiKey._id,
      keyName: apiKey.name,
    });

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        { _id: apiKey._id, name: apiKey.name, isActive: false },
        'API key revoked successfully'
      )
    );
  } catch (error) {
    logger.error('Error revoking API key:', error);
    next(error);
  }
};

/**
 * @desc    Permanently delete API key (hard delete)
 * @route   DELETE /api/keys/:id/permanent
 * @access  Private
 */
const deleteKey = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const apiKey = await ApiKey.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!apiKey) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        formatError(ERROR_CODES.NOT_FOUND, 'API key not found')
      );
    }

    logger.warn(`API key permanently deleted: ${apiKey._id}`, {
      userId,
      keyId: apiKey._id,
      keyName: apiKey.name,
    });

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(null, 'API key permanently deleted')
    );
  } catch (error) {
    logger.error('Error deleting API key:', error);
    next(error);
  }
};

/**
 * @desc    Rotate API key (generate new key, revoke old one)
 * @route   POST /api/keys/:id/rotate
 * @access  Private
 */
const rotateKey = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const oldKey = await ApiKey.findOne({
      _id: id,
      userId,
      isActive: true,
    });

    if (!oldKey) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        formatError(ERROR_CODES.NOT_FOUND, 'API key not found or already revoked')
      );
    }

    // Generate new key with same name (appending timestamp)
    const newName = `${oldKey.name} (Rotated ${new Date().toISOString().split('T')[0]})`;
    const { key, apiKey } = await ApiKey.generateKey(
      userId,
      newName,
      oldKey.description,
      process.env.NODE_ENV === 'production'
    );

    // Revoke old key
    oldKey.isActive = false;
    await oldKey.save();

    logger.info(`API key rotated`, {
      userId,
      oldKeyId: oldKey._id,
      newKeyId: apiKey._id,
    });

    res.status(HTTP_STATUS.CREATED).json(
      formatSuccess(
        {
          key, // New plain text key - only shown once!
          apiKey: {
            _id: apiKey._id,
            name: apiKey.name,
            description: apiKey.description,
            prefix: apiKey.prefix,
            createdAt: apiKey.createdAt,
            isActive: apiKey.isActive,
          },
          revokedKey: {
            _id: oldKey._id,
            name: oldKey.name,
          },
        },
        'API key rotated successfully. Old key revoked. Save the new key - it will not be shown again!'
      )
    );
  } catch (error) {
    logger.error('Error rotating API key:', error);
    next(error);
  }
};

module.exports = {
  generateKey,
  listKeys,
  getKey,
  updateKey,
  revokeKey,
  deleteKey,
  rotateKey,
};
