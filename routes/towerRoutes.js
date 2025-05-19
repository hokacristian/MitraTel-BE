const express = require('express');
const { createTower, getAllTowers, getTowerById, getTowerCount } = require('../controllers/towerController');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// IMPORTANT: Specific routes must come BEFORE parameterized routes
// Get tower count route - MUST be before /:id route
router.get('/count', getTowerCount);

// Get all towers
router.get('/', getAllTowers);

// Get tower by ID - this will match any /towers/:something pattern
// unless a more specific route is defined first
router.get('/:id', getTowerById);

// Create tower - only accessible by ADMIN
router.post('/', roleMiddleware('ADMIN'), createTower);

module.exports = router;