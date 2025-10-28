/**
 * Endpoint Controller
 * Handles webhook endpoint CRUD operations
 */

const Endpoint = require('../models/Endpoint');
const { formatSuccess, formatError } = require('../utils/helpers');
const { HTTP_STATUS, ERROR_CODES, ENDPOINT_LIMITS } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * @desc    Create new webhook endpoint
 * @route   POST /api/endpoints
 * @access  Private
 */
const createEndpoint = async (req, res, next) => {
  try {
    const { name, destinationUrl, description, customHeaders, retryConfig } = req.body;
    const userId = req.user._id;

    // Check if user has reached their endpoint limit
    const existingEndpointsCount = await Endpoint.countDocuments({
      userId,
      isActive: true,
    });

    const maxEndpoints = ENDPOINT_LIMITS[req.user.subscriptionTier]?.maxEndpoints || 
                         ENDPOINT_LIMITS.free.maxEndpoints;

    if (existingEndpointsCount >= maxEndpoints) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        formatError(
          ERROR_CODES.QUOTA_EXCEEDED,
          `Endpoint limit reached. Your ${req.user.subscriptionTier} tier allows ${maxEndpoints} active endpoints.`,
          [
            {
              tier: req.user.subscriptionTier,
              current: existingEndpointsCount,
              limit: maxEndpoints,
            },
          ]
        )
      );
    }

    // Check for duplicate name
    const existingEndpoint = await Endpoint.findOne({
      userId,
      name,
      isActive: true,
    });

    if (existingEndpoint) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatError(
          ERROR_CODES.VALIDATION_ERROR,
          'An endpoint with this name already exists'
        )
      );
    }

    // Create the endpoint
    const endpoint = await Endpoint.create({
      userId,
      name,
      destinationUrl,
      description,
      customHeaders: customHeaders || {},
      retryConfig: retryConfig || {},
    });

    // Generate webhook URL
    const webhookUrl = endpoint.getWebhookUrl();

    logger.info(`Endpoint created for user ${userId}`, {
      userId,
      endpointId: endpoint._id,
      endpointName: name,
    });

    res.status(HTTP_STATUS.CREATED).json(
      formatSuccess(
        {
          endpoint: {
            _id: endpoint._id,
            name: endpoint.name,
            destinationUrl: endpoint.destinationUrl,
            description: endpoint.description,
            webhookUrl,
            secret: endpoint.secret, // Show secret only once
            customHeaders: endpoint.customHeaders,
            retryConfig: endpoint.retryConfig,
            isActive: endpoint.isActive,
            createdAt: endpoint.createdAt,
          },
        },
        'Endpoint created successfully. Save the webhook URL and secret - the secret will not be shown again!'
      )
    );
  } catch (error) {
    logger.error('Error creating endpoint:', error);
    next(error);
  }
};

/**
 * @desc    List all endpoints for current user
 * @route   GET /api/endpoints
 * @access  Private
 */
const listEndpoints = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { includeInactive = false, page = 1, limit = 20 } = req.query;

    const filter = { userId };
    if (!includeInactive) {
      filter.isActive = true;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [endpoints, total] = await Promise.all([
      Endpoint.find(filter)
        .select('-secret') // Never return the secret in list view
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Endpoint.countDocuments(filter),
    ]);

    // Add webhook URLs to each endpoint
    const endpointsWithUrls = endpoints.map(endpoint => ({
      ...endpoint.toObject(),
      webhookUrl: endpoint.getWebhookUrl(),
      successRate: endpoint.getSuccessRate(),
    }));

    // Get count for quota display
    const activeCount = await Endpoint.countDocuments({
      userId,
      isActive: true,
    });

    const maxEndpoints = ENDPOINT_LIMITS[req.user.subscriptionTier]?.maxEndpoints || 
                         ENDPOINT_LIMITS.free.maxEndpoints;

    res.status(HTTP_STATUS.OK).json(
      formatSuccess({
        endpoints: endpointsWithUrls,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
        quota: {
          used: activeCount,
          limit: maxEndpoints,
          tier: req.user.subscriptionTier,
        },
      })
    );
  } catch (error) {
    logger.error('Error listing endpoints:', error);
    next(error);
  }
};

/**
 * @desc    Get single endpoint details
 * @route   GET /api/endpoints/:id
 * @access  Private
 */
const getEndpoint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { includeSecret = 'false' } = req.query;

    // Build query
    const query = Endpoint.findOne({ _id: id, userId });
    
    // Include secret if requested
    if (includeSecret === 'true') {
      query.select('+secret');
    }

    const endpoint = await query;

    if (!endpoint) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        formatError(ERROR_CODES.NOT_FOUND, 'Endpoint not found')
      );
    }

    const endpointData = {
      ...endpoint.toObject(),
      webhookUrl: endpoint.getWebhookUrl(),
      successRate: endpoint.getSuccessRate(),
    };

    res.status(HTTP_STATUS.OK).json(formatSuccess(endpointData));
  } catch (error) {
    logger.error('Error getting endpoint:', error);
    next(error);
  }
};

/**
 * @desc    Update endpoint
 * @route   PUT /api/endpoints/:id
 * @access  Private
 */
const updateEndpoint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, destinationUrl, description, customHeaders, retryConfig } = req.body;
    const userId = req.user._id;

    // Check for duplicate name (excluding current endpoint)
    if (name) {
      const duplicate = await Endpoint.findOne({
        userId,
        name,
        _id: { $ne: id },
        isActive: true,
      });

      if (duplicate) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
          formatError(
            ERROR_CODES.VALIDATION_ERROR,
            'An endpoint with this name already exists'
          )
        );
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (destinationUrl) updateData.destinationUrl = destinationUrl;
    if (description !== undefined) updateData.description = description;
    if (customHeaders) updateData.customHeaders = customHeaders;
    if (retryConfig) updateData.retryConfig = retryConfig;

    const endpoint = await Endpoint.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    ).select('-secret');

    if (!endpoint) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        formatError(ERROR_CODES.NOT_FOUND, 'Endpoint not found')
      );
    }

    logger.info(`Endpoint updated: ${endpoint._id}`, { userId, endpointId: endpoint._id });

    const endpointData = {
      ...endpoint.toObject(),
      webhookUrl: endpoint.getWebhookUrl(),
      successRate: endpoint.getSuccessRate(),
    };

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(endpointData, 'Endpoint updated successfully')
    );
  } catch (error) {
    logger.error('Error updating endpoint:', error);
    next(error);
  }
};

/**
 * @desc    Delete endpoint (soft delete)
 * @route   DELETE /api/endpoints/:id
 * @access  Private
 */
const deleteEndpoint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const endpoint = await Endpoint.findOne({
      _id: id,
      userId,
    });

    if (!endpoint) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        formatError(ERROR_CODES.NOT_FOUND, 'Endpoint not found')
      );
    }

    // Soft delete - just mark as inactive
    endpoint.isActive = false;
    await endpoint.save();

    logger.info(`Endpoint deleted: ${endpoint._id}`, {
      userId,
      endpointId: endpoint._id,
      endpointName: endpoint.name,
    });

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        { _id: endpoint._id, name: endpoint.name, isActive: false },
        'Endpoint deleted successfully'
      )
    );
  } catch (error) {
    logger.error('Error deleting endpoint:', error);
    next(error);
  }
};

/**
 * @desc    Regenerate endpoint secret
 * @route   POST /api/endpoints/:id/regenerate-secret
 * @access  Private
 */
const regenerateSecret = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const endpoint = await Endpoint.findOne({
      _id: id,
      userId,
    });

    if (!endpoint) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        formatError(ERROR_CODES.NOT_FOUND, 'Endpoint not found')
      );
    }

    // Generate new secret
    endpoint.secret = endpoint.generateSecret();
    await endpoint.save();

    logger.info(`Endpoint secret regenerated: ${endpoint._id}`, {
      userId,
      endpointId: endpoint._id,
    });

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        {
          _id: endpoint._id,
          name: endpoint.name,
          secret: endpoint.secret, // Show new secret
          webhookUrl: endpoint.getWebhookUrl(),
        },
        'Secret regenerated successfully. Save this secret - it will not be shown again!'
      )
    );
  } catch (error) {
    logger.error('Error regenerating secret:', error);
    next(error);
  }
};

/**
 * @desc    Get endpoint statistics
 * @route   GET /api/endpoints/:id/stats
 * @access  Private
 */
const getEndpointStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const endpoint = await Endpoint.findOne({
      _id: id,
      userId,
    }).select('-secret');

    if (!endpoint) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        formatError(ERROR_CODES.NOT_FOUND, 'Endpoint not found')
      );
    }

    const stats = {
      endpointId: endpoint._id,
      name: endpoint.name,
      statistics: endpoint.statistics,
      successRate: endpoint.getSuccessRate(),
      totalRequests: endpoint.statistics.totalRequests,
      successfulRequests: endpoint.statistics.successfulRequests,
      failedRequests: endpoint.statistics.failedRequests,
      lastRequestAt: endpoint.statistics.lastRequestAt,
      averageResponseTime: endpoint.statistics.averageResponseTime,
    };

    res.status(HTTP_STATUS.OK).json(formatSuccess(stats));
  } catch (error) {
    logger.error('Error getting endpoint stats:', error);
    next(error);
  }
};

/**
 * @desc    Test endpoint (send test webhook)
 * @route   POST /api/endpoints/:id/test
 * @access  Private
 */
const testEndpoint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { payload = { test: true, timestamp: new Date().toISOString() } } = req.body;

    const endpoint = await Endpoint.findOne({
      _id: id,
      userId,
    });

    if (!endpoint) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        formatError(ERROR_CODES.NOT_FOUND, 'Endpoint not found')
      );
    }

    const webhookUrl = endpoint.getWebhookUrl();

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        {
          message: 'Test webhook ready to send',
          webhookUrl,
          payload,
          instructions: `Send a POST request to ${webhookUrl} with your test payload`,
        },
        'Endpoint test information generated'
      )
    );
  } catch (error) {
    logger.error('Error testing endpoint:', error);
    next(error);
  }
};

module.exports = {
  createEndpoint,
  listEndpoints,
  getEndpoint,
  updateEndpoint,
  deleteEndpoint,
  regenerateSecret,
  getEndpointStats,
  testEndpoint,
};
