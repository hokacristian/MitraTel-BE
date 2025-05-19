const express = require('express');
const { createWilayah, getAllWilayah, getWilayahById } = require('../controllers/wilayahController');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all wilayah - accessible by all authenticated users
router.get('/', getAllWilayah);

// Get wilayah by ID - accessible by all authenticated users
router.get('/:id', getWilayahById);

// Create wilayah - only accessible by ADMIN
router.post('/', roleMiddleware('ADMIN'), createWilayah);

module.exports = router;