/**
 * Validation Middleware
 * Request validation using Joi schemas
 */

const Joi = require('joi');
const { formatError } = require('../utils/helpers');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

/**
 * Validate request data against Joi schema
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Middleware function
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        formatError(ERROR_CODES.VALIDATION_ERROR, 'Validation failed', details)
      );
    }

    // Replace request data with validated and sanitized data
    req[property] = value;
    next();
  };
};

// Common validation schemas

const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'any.required': 'Password is required',
  }),
  fullName: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Full name must be at least 2 characters',
    'any.required': 'Full name is required',
  }),
  company: Joi.string().max(100).optional().allow(''),
  phone: Joi.string().max(20).optional().allow(''),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const createEndpointSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'any.required': 'Endpoint name is required',
  }),
  description: Joi.string().max(500).optional().allow(''),
  destinationUrl: Joi.string().uri({ scheme: ['http', 'https'] }).required().messages({
    'string.uri': 'Please provide a valid HTTP/HTTPS URL',
    'any.required': 'Destination URL is required',
  }),
  customHeaders: Joi.object().pattern(
    Joi.string(),
    Joi.string()
  ).optional(),
  retryConfig: Joi.object({
    maxRetries: Joi.number().min(0).max(10).optional(),
    retryIntervals: Joi.array().items(Joi.number()).optional(),
  }).optional(),
});

const updateEndpointSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional().allow(''),
  destinationUrl: Joi.string().uri({ scheme: ['http', 'https'] }).optional(),
  customHeaders: Joi.object().pattern(
    Joi.string(),
    Joi.string()
  ).optional(),
  isActive: Joi.boolean().optional(),
  retryConfig: Joi.object({
    maxRetries: Joi.number().min(0).max(10).optional(),
    retryIntervals: Joi.array().items(Joi.number()).optional(),
  }).optional(),
});

const createApiKeySchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'any.required': 'API key name is required',
  }),
  description: Joi.string().max(500).optional().allow(''),
});

const updateApiKeySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional().allow(''),
});

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const webhookFilterSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('success', 'pending', 'failed').optional(),
  endpointId: Joi.string().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
});

const updateUserSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).optional(),
  company: Joi.string().max(100).optional().allow(''),
  phone: Joi.string().max(20).optional().allow(''),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required().messages({
    'string.min': 'New password must be at least 8 characters',
  }),
});

const adminCreateUserSchema = Joi.object({
  email: Joi.string().email().required(),
  fullName: Joi.string().min(2).max(100).required(),
  company: Joi.string().max(100).optional().allow(''),
  phone: Joi.string().max(20).optional().allow(''),
  subscriptionTier: Joi.string().valid('free', 'starter', 'business', 'enterprise').optional(),
  webhookQuota: Joi.number().integer().min(0).optional(),
});

const adminUpdateSubscriptionSchema = Joi.object({
  subscriptionTier: Joi.string().valid('free', 'starter', 'business', 'enterprise').required(),
  subscriptionStatus: Joi.string().valid('active', 'cancelled', 'past_due').optional(),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  createEndpointSchema,
  updateEndpointSchema,
  createApiKeySchema,
  updateApiKeySchema,
  paginationSchema,
  webhookFilterSchema,
  updateUserSchema,
  changePasswordSchema,
  adminCreateUserSchema,
  adminUpdateSubscriptionSchema,
};
