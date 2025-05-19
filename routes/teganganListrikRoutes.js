// src/routes/teganganListrikRoutes.js
const express = require('express');
const { createTeganganListrik, getAllTeganganListrik, getTeganganListrikById } = require('../controllers/teganganListrikController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const multer = require('multer');

// Set up multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all tegangan listrik records - accessible by all authenticated users
router.get('/', getAllTeganganListrik);

// Get tegangan listrik record by ID - accessible by all authenticated users
router.get('/:id', getTeganganListrikById);

// Create tegangan listrik record - accessible by all authenticated users
// Note: We use upload.single() instead of upload.array() since this API only expects one image
router.post('/', upload.single('file'), createTeganganListrik);

module.exports = router;