const express = require('express');
const { getUserHistory } = require('../controllers/historyController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// Semua route history memerlukan autentikasi
router.use(authMiddleware);

// Get user history
router.get('/', getUserHistory);

module.exports = router;