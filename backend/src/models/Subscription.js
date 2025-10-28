/**
 * Subscription Model
 * Tracks payment subscriptions via Paystack
 */

const mongoose = require('mongoose');
const { SUBSCRIPTION_TIERS, SUBSCRIPTION_STATUS } = require('../config/constants');

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tier: {
      type: String,
      enum: Object.values(SUBSCRIPTION_TIERS),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(SUBSCRIPTION_STATUS),
      default: SUBSCRIPTION_STATUS.ACTIVE,
    },
    paystackSubscriptionCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    paystackCustomerCode: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'GHS', // Ghana Cedis
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    nextBillingDate: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ paystackSubscriptionCode: 1 });
subscriptionSchema.index({ nextBillingDate: 1 });

/**
 * Cancel subscription
 * @param {string} reason - Cancellation reason
 */
subscriptionSchema.methods.cancel = async function (reason) {
  this.status = SUBSCRIPTION_STATUS.CANCELLED;
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  await this.save();
};

/**
 * Check if subscription is active
 * @returns {boolean}
 */
subscriptionSchema.methods.isActive = function () {
  return this.status === SUBSCRIPTION_STATUS.ACTIVE;
};

/**
 * Update next billing date (monthly)
 */
subscriptionSchema.methods.updateNextBillingDate = async function () {
  const currentDate = this.nextBillingDate || new Date();
  const nextDate = new Date(currentDate);
  nextDate.setMonth(nextDate.getMonth() + 1);
  this.nextBillingDate = nextDate;
  await this.save();
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
