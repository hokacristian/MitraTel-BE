const express = require('express');
const { createPerangkatAntenna, getAllPerangkatAntennas, getPerangkatAntennaById } = require('../controllers/perangkatAntennaController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const multer = require('multer');

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
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
router.post('/', upload.array('photos', 10), createPerangkatAntenna);

module.exports = router;