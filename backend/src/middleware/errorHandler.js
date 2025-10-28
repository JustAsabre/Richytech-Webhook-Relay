/**
 * Error Handler Middleware
 * Global error handling for Express
 */

const logger = require('../utils/logger');
const { formatError } = require('../utils/helpers');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

/**
 * Custom error class
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode = ERROR_CODES.INTERNAL_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    error = new AppError(message, HTTP_STATUS.CONFLICT, ERROR_CODES.VALIDATION_ERROR);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    const message = messages.join(', ');
    error = new AppError(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new AppError(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new AppError(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
  }

  // Send response
  res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
    formatError(
      error.errorCode || ERROR_CODES.INTERNAL_ERROR,
      error.message || 'Internal server error',
      process.env.NODE_ENV === 'development' ? [error.stack] : []
    )
  );
};

/**
 * Handle 404 errors
 */
const notFound = (req, res, next) => {
  const error = new AppError(
    `Route ${req.originalUrl} not found`,
    HTTP_STATUS.NOT_FOUND,
    ERROR_CODES.NOT_FOUND
  );
  next(error);
};

module.exports = {
  AppError,
  errorHandler,
  notFound,
};
