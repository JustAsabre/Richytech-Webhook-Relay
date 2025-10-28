/**
 * Endpoint Routes
 * Routes for webhook endpoint management
 */

const express = require('express');
const router = express.Router();

const {
  createEndpoint,
  listEndpoints,
  getEndpoint,
  updateEndpoint,
  deleteEndpoint,
  regenerateSecret,
  getEndpointStats,
  testEndpoint,
} = require('../controllers/endpointController');

const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { createEndpointSchema, updateEndpointSchema } = require('../middleware/validator');

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/endpoints
 * @desc    Create new webhook endpoint
 * @access  Private
 */
router.post('/', validate(createEndpointSchema), createEndpoint);

/**
 * @route   GET /api/endpoints
 * @desc    List all endpoints
 * @access  Private
 */
router.get('/', listEndpoints);

/**
 * @route   GET /api/endpoints/:id
 * @desc    Get single endpoint details
 * @access  Private
 */
router.get('/:id', getEndpoint);

/**
 * @route   PUT /api/endpoints/:id
 * @desc    Update endpoint
 * @access  Private
 */
router.put('/:id', validate(updateEndpointSchema), updateEndpoint);

/**
 * @route   DELETE /api/endpoints/:id
 * @desc    Delete endpoint (soft delete)
 * @access  Private
 */
router.delete('/:id', deleteEndpoint);

/**
 * @route   POST /api/endpoints/:id/regenerate-secret
 * @desc    Regenerate endpoint secret
 * @access  Private
 */
router.post('/:id/regenerate-secret', regenerateSecret);

/**
 * @route   GET /api/endpoints/:id/stats
 * @desc    Get endpoint statistics
 * @access  Private
 */
router.get('/:id/stats', getEndpointStats);

/**
 * @route   POST /api/endpoints/:id/test
 * @desc    Test endpoint
 * @access  Private
 */
router.post('/:id/test', testEndpoint);

module.exports = router;
