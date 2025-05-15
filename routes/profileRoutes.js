const express = require('express');
const { getUserProfile, updateUserProfile } = require('../controllers/profileController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// All profile routes require authentication
router.use(authMiddleware);

// Get user profile
router.get('/', getUserProfile);

// Update user profile
router.patch('/', updateUserProfile);

module.exports = router;