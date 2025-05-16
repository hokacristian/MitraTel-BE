// Updated kebersihanSiteRoutes.js for handling multipart/form-data

const express = require('express');
const { createKebersihanSite, getAllKebersihanSites, getKebersihanSiteById } = require('../controllers/kebersihanSiteController');
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

// Get all kebersihan sites - accessible by all authenticated users
router.get('/', getAllKebersihanSites);

// Get kebersihan site by ID - accessible by all authenticated users
router.get('/:id', getKebersihanSiteById);

// Create kebersihan site - accessible by all authenticated users
// Note: Based on the screenshot, we're expecting a field named 'image' for the file upload
router.post('/', upload.array('image', 10), createKebersihanSite);

module.exports = router;