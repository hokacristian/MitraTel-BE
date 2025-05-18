const express = require('express');
const { register, login, whoami } = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public authentication routes
router.post('/register', register);
router.post('/login', login);

// Protected route - requires authentication
router.get('/whoami', authMiddleware, whoami);

module.exports = router;