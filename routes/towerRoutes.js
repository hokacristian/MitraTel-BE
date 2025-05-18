const express = require('express');
const { createTower, getAllTowers, getTowerById } = require('../controllers/towerController');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all towers - accessible by all authenticated users
router.get('/', getAllTowers);

// Get tower by ID - accessible by all authenticated users
router.get('/:id', getTowerById);

// Create tower - only accessible by ADMIN
router.post('/', roleMiddleware('ADMIN'), createTower);

router.get('/count', getTowerCount);
// Get tower count - accessible by all authenticated users

module.exports = router;