// Updated perangkatAntennaController.js for immediate response with job queue

const perangkatAntennaService = require('../services/perangkatAntennaService');

/**
 * Create a new Perangkat Antenna record - returns immediately with photo URLs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createPerangkatAntenna = async (req, res) => {
  try {
    // Validate required files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one photo is required' });
    }
    
    // Validate required fields
    const { towerId, latitude, longitude } = req.body;
    
    if (!towerId) {
      return res.status(400).json({ message: 'Tower ID is required' }); 
    }
    
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }
    
    // Get user ID from authenticated user
    const userId = req.user.id;
    
    console.log('Creating PerangkatAntenna with data:', {
      towerId,
      latitude,
      longitude,
      height: req.body.height || 'To be detected by ML',
      fileCount: req.files.length,
      userId
    });
    
    // Create initial record with photos already uploaded and URLs included
    const initialRecord = await perangkatAntennaService.createInitialRecord(
      req.body, 
      req.files, 
      userId
    );
    
    // Start background processing for ML analysis (don't wait for it to finish)
    perangkatAntennaService.processInBackground(initialRecord.id, req.body, req.files, userId)
      .catch(error => {
        console.error('Background processing error:', error);
      });
    
    res.status(201).json({
      message: 'Perangkat antenna data created successfully. ML analysis is processing in the background.',
      data: initialRecord
    });
  } catch (error) {
    console.error('Error in createPerangkatAntenna controller:', error);
    
    // Send appropriate error response based on error type
    if (error.message.includes('not found')) {
      return res.status(404).json({ 
        message: error.message
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to create perangkat antenna data', 
      error: error.message 
    });
  }
};

/**
 * Get all Perangkat Antenna records
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllPerangkatAntennas = async (req, res) => {
  try {
    const result = await perangkatAntennaService.getAllPerangkatAntennas(req.query);
    
    res.status(200).json({
      message: 'Perangkat antenna data retrieved successfully',
      ...result
    });
  } catch (error) {
    console.error('Error in getAllPerangkatAntennas controller:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve perangkat antenna data', 
      error: error.message 
    });
  }
};

/**
 * Get a Perangkat Antenna record by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPerangkatAntennaById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Valid ID is required' });
    }
    
    const result = await perangkatAntennaService.getPerangkatAntennaById(id);
    
    if (!result) {
      return res.status(404).json({ message: 'Perangkat antenna data not found' });
    }
    
    res.status(200).json({
      message: 'Perangkat antenna data retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in getPerangkatAntennaById controller:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve perangkat antenna data', 
      error: error.message 
    });
  }
};

module.exports = {
  createPerangkatAntenna,
  getAllPerangkatAntennas,
  getPerangkatAntennaById
};