/**
 * API Key Routes
 * Routes for API key management
 */

const express = require('express');
const router = express.Router();

const {
  generateKey,
  listKeys,
  getKey,
  updateKey,
  revokeKey,
  deleteKey,
  rotateKey,
} = require('../controllers/apiKeyController');

const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { createApiKeySchema, updateApiKeySchema } = require('../middleware/validator');

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/keys
 * @desc    Generate new API key
 * @access  Private
 */
router.post('/', validate(createApiKeySchema), generateKey);

/**
 * @route   GET /api/keys
 * @desc    List all API keys
 * @access  Private
 */
router.get('/', listKeys);

/**
 * @route   GET /api/keys/:id
 * @desc    Get single API key details
 * @access  Private
 */
router.get('/:id', getKey);

/**
 * @route   PUT /api/keys/:id
 * @desc    Update API key (name/description only)
 * @access  Private
 */
router.put('/:id', validate(updateApiKeySchema), updateKey);

/**
 * @route   DELETE /api/keys/:id
 * @desc    Revoke API key (soft delete)
 * @access  Private
 */
router.delete('/:id', revokeKey);

/**
 * @route   DELETE /api/keys/:id/permanent
 * @desc    Permanently delete API key
 * @access  Private
 */
router.delete('/:id/permanent', deleteKey);

/**
 * @route   POST /api/keys/:id/rotate
 * @desc    Rotate API key (generate new, revoke old)
 * @access  Private
 */
router.post('/:id/rotate', rotateKey);

module.exports = router;
