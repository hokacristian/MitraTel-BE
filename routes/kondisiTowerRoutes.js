// Updated kondisiTowerRoutes.js for handling multipart/form-data with pose field

const express = require('express');
const { createKondisiTower, getAllKondisiTowers, getKondisiTowerById } = require('../controllers/kondisiTowerController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const multer = require('multer');

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for each file
  }
});

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all kondisi towers - accessible by all authenticated users
router.get('/', getAllKondisiTowers);

// Get kondisi tower by ID - accessible by all authenticated users
router.get('/:id', getKondisiTowerById);

// Create kondisi tower - accessible by all authenticated users
// Using multer fields for different file types, added poseFile as optional
router.post('/', upload.fields([
  { name: 'rustFile', maxCount: 1 },
  { name: 'boltsFile', maxCount: 1 },
  { name: 'poseFile', maxCount: 1 } // Optional pose file
]), createKondisiTower);

module.exports = router;