/**
 * User Model
 * Represents client and admin users
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { SUBSCRIPTION_TIERS, USER_ROLES, WEBHOOK_QUOTAS, SUBSCRIPTION_STATUS } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't include password in queries by default
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.CLIENT,
    },
    subscriptionTier: {
      type: String,
      enum: Object.values(SUBSCRIPTION_TIERS),
      default: SUBSCRIPTION_TIERS.FREE,
    },
    subscriptionStatus: {
      type: String,
      enum: Object.values(SUBSCRIPTION_STATUS),
      default: SUBSCRIPTION_STATUS.ACTIVE,
    },
    subscriptionEndsAt: {
      type: Date,
      default: null,
    },
    paystackCustomerCode: {
      type: String,
      default: null,
    },
    webhookQuota: {
      type: Number,
      default: function () {
        return WEBHOOK_QUOTAS[this.subscriptionTier] || WEBHOOK_QUOTAS.free;
      },
    },
    webhookUsage: {
      type: Number,
      default: 0,
    },
    resetDate: {
      type: Date,
      default: function () {
        // Reset date is first day of next month
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 1);
      },
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ subscriptionTier: 1 });
userSchema.index({ subscriptionStatus: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to check if quota exceeded
userSchema.methods.hasQuotaRemaining = function () {
  return this.webhookUsage < this.webhookQuota;
};

// Method to increment webhook usage
userSchema.methods.incrementWebhookUsage = async function () {
  this.webhookUsage += 1;
  await this.save();
};

// Method to reset monthly quota
userSchema.methods.resetMonthlyQuota = async function () {
  this.webhookUsage = 0;
  const now = new Date();
  this.resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  await this.save();
};

// Virtual for quota percentage used
userSchema.virtual('quotaPercentage').get(function () {
  if (this.webhookQuota === Infinity) return 0;
  return (this.webhookUsage / this.webhookQuota) * 100;
});

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
