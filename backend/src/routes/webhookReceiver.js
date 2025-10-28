/**
 * Webhook Receiver Routes
 * Public endpoint for receiving webhooks from external services
 */

const express = require('express');
const router = express.Router();
const { receiveWebhook } = require('../controllers/webhookController');

/**
 * @route   POST /webhook/:userId/:endpointId
 * @desc    Receive webhook from external service
 * @access  Public (validates endpoint and quota internally)
 * 
 * This is the core webhook receiving endpoint.
 * External services send webhooks here using the URL:
 * http://your-domain.com/webhook/{userId}/{endpointId}
 * 
 * The webhook is validated, logged, and queued for async processing.
 */
router.post('/:userId/:endpointId', receiveWebhook);

module.exports = router;
