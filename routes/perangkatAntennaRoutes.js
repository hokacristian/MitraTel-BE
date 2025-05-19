// Updated perangkatAntennaRoutes.js for handling multipart/form-data

const express = require('express');
const { createPerangkatAntenna, getAllPerangkatAntennas, getPerangkatAntennaById } = require('../controllers/perangkatAntennaController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const multer = require('multer');

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for each file
    files: 10 // Maximum 10 files
  }
});

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all perangkat antennas - accessible by all authenticated users
router.get('/', getAllPerangkatAntennas);

// Get perangkat antenna by ID - accessible by all authenticated users
router.get('/:id', getPerangkatAntennaById);

// Create perangkat antenna - accessible by all authenticated users
// Note: Based on the screenshot, we're expecting a field named 'file' for the file upload
router.post('/', upload.array('file', 10), createPerangkatAntenna);

module.exports = router;