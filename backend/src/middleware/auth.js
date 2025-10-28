/**
 * Authentication Middleware
 * Verify JWT tokens and protect routes
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { formatError } = require('../utils/helpers');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Verify JWT token and attach user to request
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header (Bearer token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies (if using cookie-based auth)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Check if token exists
    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        formatError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Not authorized to access this route. Please login.'
        )
      );
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json(
          formatError(
            ERROR_CODES.AUTHENTICATION_ERROR,
            'User no longer exists'
          )
        );
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json(
          formatError(
            ERROR_CODES.AUTHORIZATION_ERROR,
            'Your account has been deactivated. Please contact support.'
          )
        );
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      logger.error(`JWT verification failed: ${error.message}`);
      
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        formatError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Invalid or expired token. Please login again.'
        )
      );
    }
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      formatError(ERROR_CODES.INTERNAL_ERROR, 'Authentication error')
    );
  }
};

/**
 * Restrict access to specific roles
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        formatError(
          ERROR_CODES.AUTHENTICATION_ERROR,
          'Not authorized to access this route'
        )
      );
    }

    if (!roles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        formatError(
          ERROR_CODES.AUTHORIZATION_ERROR,
          `User role '${req.user.role}' is not authorized to access this route`
        )
      );
    }

    next();
  };
};

/**
 * Generate JWT token
 * @param {string} id - User ID
 * @returns {string} JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * Send token response (cookie + JSON)
 * @param {Object} user - User object
 * @param {number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 */
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id);

  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict',
  };

  // Remove password from output
  const userObj = user.toObject();
  delete userObj.password;

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      message,
      token,
      data: {
        user: userObj,
      },
    });
};

module.exports = {
  protect,
  authorize,
  generateToken,
  sendTokenResponse,
};
