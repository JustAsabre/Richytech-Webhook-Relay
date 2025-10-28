const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

// All analytics routes require authentication
router.use(protect);

/**
 * @route   GET /api/analytics/stats
 * @desc    Get dashboard statistics
 * @access  Private
 */
router.get('/stats', analyticsController.getStats);

/**
 * @route   GET /api/analytics/volume
 * @desc    Get webhook volume over time
 * @access  Private
 */
router.get('/volume', analyticsController.getWebhookVolume);

/**
 * @route   GET /api/analytics/endpoints
 * @desc    Get endpoint performance metrics
 * @access  Private
 */
router.get('/endpoints', analyticsController.getEndpointPerformance);

module.exports = router;
