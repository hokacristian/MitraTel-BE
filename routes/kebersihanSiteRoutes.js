const express = require('express');
const { createKebersihanSite, getAllKebersihanSites, getKebersihanSiteById } = require('../controllers/kebersihanSiteController');
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

// Get all kebersihan sites - accessible by all authenticated users
router.get('/', getAllKebersihanSites);

// Get kebersihan site by ID - accessible by all authenticated users
router.get('/:id', getKebersihanSiteById);

// Create kebersihan site - accessible by all authenticated users
router.post('/', upload.array('photos', 10), createKebersihanSite);

module.exports = router;