// Updated kondisiTowerController.js with pose detection handling

const kondisiTowerService = require('../services/kondisiTowerService');

/**
 * Create a new Kondisi Tower record - returns immediately with photo URLs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createKondisiTower = async (req, res) => {
  try {
    // Enhanced logging
    console.log('=== KondisiTower Request Received ===');
    console.log('Body:', req.body);
    console.log('Files:', req.files ? Object.keys(req.files) : 'No files');
    console.log('rustFile:', req.files?.rustFile ? `Present (${req.files.rustFile.length} files)` : 'Missing');
    console.log('boltsFile:', req.files?.boltsFile ? `Present (${req.files.boltsFile.length} files)` : 'Missing');
    console.log('poseFile:', req.files?.poseFile ? `Present (${req.files.poseFile.length} files)` : 'Missing');
    
    // Check required files
    if (!req.files || !req.files.rustFile || !req.files.boltsFile) {
      console.error('Required files missing - aborting');
      return res.status(400).json({ 
        message: 'Both rust and bolts photos are required' 
      });
    }
    
    // Rest of your code...
    
    // Validate required fields
    const { towerId } = req.body;
    
    if (!towerId) {
      return res.status(400).json({ message: 'Tower ID is required' });
    }
    
    // Get user ID from authenticated user
    const userId = req.user.id;
    
    // Check if pose file is provided (optional)
    const poseFile = req.files.poseFile ? req.files.poseFile[0] : null;
    
    console.log('Creating KondisiTower with data:', {
      towerId,
      rustFile: req.files.rustFile[0] ? req.files.rustFile[0].originalname : 'None',
      boltsFile: req.files.boltsFile[0] ? req.files.boltsFile[0].originalname : 'None',
      poseFile: poseFile ? poseFile.originalname : 'None (Optional)',
      userId
    });
    
    // Create initial record with photos already uploaded and URLs included
    const initialRecord = await kondisiTowerService.createInitialRecord(
      req.body, 
      req.files.rustFile[0], 
      req.files.boltsFile[0],
      poseFile,
      userId
    );
    
    // Start background processing for ML analysis (don't wait for it to finish)
    kondisiTowerService.processInBackground(
      initialRecord.id, 
      req.body, 
      req.files.rustFile[0], 
      req.files.boltsFile[0],
      poseFile,
      userId
    ).catch(error => {
      console.error('Background processing error:', error);
    });
    
    res.status(201).json({
      message: 'Kondisi tower data created successfully. ML analysis is processing in the background.',
      data: initialRecord
    });
  } catch (error) {
    console.error('Error in createKondisiTower controller:', error);
    
    // Send appropriate error response based on error type
    if (error.message.includes('not found')) {
      return res.status(404).json({ 
        message: error.message
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to create kondisi tower data', 
      error: error.message 
    });
  }
};

/**
 * Get all Kondisi Tower records
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllKondisiTowers = async (req, res) => {
  try {
    const result = await kondisiTowerService.getAllKondisiTowers(req.query);
    
    res.status(200).json({
      message: 'Kondisi tower data retrieved successfully',
      ...result
    });
  } catch (error) {
    console.error('Error in getAllKondisiTowers controller:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve kondisi tower data', 
      error: error.message 
    });
  }
};

/**
 * Get a Kondisi Tower record by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getKondisiTowerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Valid ID is required' });
    }
    
    const result = await kondisiTowerService.getKondisiTowerById(id);
    
    if (!result) {
      return res.status(404).json({ message: 'Kondisi tower data not found' });
    }
    
    res.status(200).json({
      message: 'Kondisi tower data retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in getKondisiTowerById controller:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve kondisi tower data', 
      error: error.message 
    });
  }
};

module.exports = {
  createKondisiTower,
  getAllKondisiTowers,
  getKondisiTowerById
};