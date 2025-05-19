// Updated kebersihanSiteController.js with job queue implementation

const kebersihanSiteService = require('../services/kebersihanSiteService');

/**
 * Create a new Kebersihan Site record - returns immediately with photo URLs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createKebersihanSite = async (req, res) => {
  try {
    // Validate required files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one photo is required' });
    }
    
    // Validate required fields
    const { towerId } = req.body;
    
    if (!towerId) {
      return res.status(400).json({ message: 'Tower ID is required' });
    }
    
    // Get user ID from authenticated user
    const userId = req.user.id;
    
    console.log('Creating KebersihanSite with data:', {
      towerId,
      fileCount: req.files.length,
      userId
    });
    
    // Create initial record with photos already uploaded and URLs included
    const initialRecord = await kebersihanSiteService.createInitialRecord(
      req.body, 
      req.files, 
      userId
    );
    
    // Start background processing for ML analysis (don't wait for it to finish)
    kebersihanSiteService.processInBackground(initialRecord.id, req.body, req.files, userId)
      .catch(error => {
        console.error('Background processing error:', error);
      });
    
    res.status(201).json({
      message: 'Kebersihan site data created successfully. ML analysis is processing in the background.',
      data: initialRecord
    });
  } catch (error) {
    console.error('Error in createKebersihanSite controller:', error);
    
    // Send appropriate error response based on error type
    if (error.message.includes('not found')) {
      return res.status(404).json({ 
        message: error.message
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to create kebersihan site data', 
      error: error.message 
    });
  }
};

/**
 * Get all Kebersihan Site records
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllKebersihanSites = async (req, res) => {
  try {
    const result = await kebersihanSiteService.getAllKebersihanSites(req.query);
    
    res.status(200).json({
      message: 'Kebersihan site data retrieved successfully',
      ...result
    });
  } catch (error) {
    console.error('Error in getAllKebersihanSites controller:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve kebersihan site data', 
      error: error.message 
    });
  }
};

/**
 * Get a Kebersihan Site record by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getKebersihanSiteById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Valid ID is required' });
    }
    
    const result = await kebersihanSiteService.getKebersihanSiteById(id);
    
    if (!result) {
      return res.status(404).json({ message: 'Kebersihan site data not found' });
    }
    
    res.status(200).json({
      message: 'Kebersihan site data retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in getKebersihanSiteById controller:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve kebersihan site data', 
      error: error.message 
    });
  }
};

module.exports = {
  createKebersihanSite,
  getAllKebersihanSites,
  getKebersihanSiteById
};