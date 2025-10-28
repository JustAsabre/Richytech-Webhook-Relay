/**
 * Authentication Controller
 * Handles user registration, login, and password management
 */

const { User } = require('../models');
const { sendTokenResponse } = require('../middleware/auth');
const { formatError, formatSuccess } = require('../utils/helpers');
const { HTTP_STATUS, ERROR_CODES, SUBSCRIPTION_TIERS, WEBHOOK_QUOTAS } = require('../config/constants');
const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  const { email, password, fullName, company, phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    return res.status(HTTP_STATUS.CONFLICT).json(
      formatError(
        ERROR_CODES.VALIDATION_ERROR,
        'User with this email already exists'
      )
    );
  }

  // Create user with free tier by default
  const user = await User.create({
    email: email.toLowerCase(),
    password,
    fullName,
    company,
    phone,
    subscriptionTier: SUBSCRIPTION_TIERS.FREE,
    webhookQuota: WEBHOOK_QUOTAS.free,
  });

  logger.info(`New user registered: ${user.email} (${user._id})`);

  // TODO: Send welcome email (will implement in email service)
  // await emailService.sendWelcomeEmail(user);

  // Send token response
  sendTokenResponse(user, HTTP_STATUS.CREATED, res, 'Registration successful');
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  // Find user and include password field
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(
      formatError(
        ERROR_CODES.AUTHENTICATION_ERROR,
        'Invalid email or password'
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

  // Check password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    logger.warn(`Failed login attempt for user: ${email}`);
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(
      formatError(
        ERROR_CODES.AUTHENTICATION_ERROR,
        'Invalid email or password'
      )
    );
  }

  // Update last login timestamp
  user.lastLoginAt = new Date();
  await user.save();

  logger.info(`User logged in: ${user.email} (${user._id})`);

  // Send token response
  sendTokenResponse(user, HTTP_STATUS.OK, res, 'Login successful');
};

/**
 * @desc    Logout user (clear cookie)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // Expire in 10 seconds
    httpOnly: true,
  });

  res.status(HTTP_STATUS.OK).json(
    formatSuccess(null, 'Logout successful')
  );
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id);

  res.status(HTTP_STATUS.OK).json(
    formatSuccess({ user })
  );
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/me
 * @access  Private
 */
const updateProfile = async (req, res) => {
  const { fullName, company, phone } = req.body;

  const fieldsToUpdate = {};
  if (fullName) fieldsToUpdate.fullName = fullName;
  if (company !== undefined) fieldsToUpdate.company = company;
  if (phone !== undefined) fieldsToUpdate.phone = phone;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true,
    }
  );

  logger.info(`User profile updated: ${user.email} (${user._id})`);

  res.status(HTTP_STATUS.OK).json(
    formatSuccess({ user }, 'Profile updated successfully')
  );
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);

  if (!isPasswordValid) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(
      formatError(
        ERROR_CODES.AUTHENTICATION_ERROR,
        'Current password is incorrect'
      )
    );
  }

  // Update password
  user.password = newPassword;
  await user.save();

  logger.info(`Password changed for user: ${user.email} (${user._id})`);

  res.status(HTTP_STATUS.OK).json(
    formatSuccess(null, 'Password changed successfully')
  );
};

/**
 * @desc    Request password reset
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Don't reveal if user exists or not
    return res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        null,
        'If an account with that email exists, a password reset link has been sent'
      )
    );
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and save to database
  user.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  user.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes

  await user.save();

  // Create reset URL
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  logger.info(`Password reset requested for user: ${user.email}`);

  // TODO: Send reset email (will implement in email service)
  // await emailService.sendPasswordResetEmail(user, resetUrl);

  res.status(HTTP_STATUS.OK).json(
    formatSuccess(
      { resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined },
      'If an account with that email exists, a password reset link has been sent'
    )
  );
};

/**
 * @desc    Reset password with token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  // Hash the token from URL
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with valid token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      formatError(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid or expired reset token'
      )
    );
  }

  // Set new password
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  logger.info(`Password reset completed for user: ${user.email}`);

  // Send token response (log user in)
  sendTokenResponse(user, HTTP_STATUS.OK, res, 'Password reset successful');
};

/**
 * @desc    Verify email with token
 * @route   GET /api/auth/verify-email/:token
 * @access  Public
 */
const verifyEmail = async (req, res) => {
  const { token } = req.params;

  // Hash the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with token
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
  }).select('+emailVerificationToken');

  if (!user) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      formatError(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid verification token'
      )
    );
  }

  // Verify email
  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  await user.save();

  logger.info(`Email verified for user: ${user.email}`);

  res.status(HTTP_STATUS.OK).json(
    formatSuccess(null, 'Email verified successfully')
  );
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
};
