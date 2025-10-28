/**
 * Webhook Routes
 * Routes for webhook management and viewing
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getWebhook,
  listWebhooks,
  retryWebhook,
} = require('../controllers/webhookController');

/**
 * @route   GET /api/webhooks
 * @desc    List webhooks with filtering
 * @access  Private
 */
router.get('/', protect, listWebhooks);

/**
 * @route   GET /api/webhooks/:id
 * @desc    Get webhook details
 * @access  Private
 */
router.get('/:id', protect, getWebhook);

/**
 * @route   POST /api/webhooks/:id/retry
 * @desc    Manually retry failed webhook
 * @access  Private
 */
router.post('/:id/retry', protect, retryWebhook);

module.exports = router;
