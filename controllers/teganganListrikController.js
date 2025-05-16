// Updated teganganListrikController.js with better error handling and validation

const teganganListrikService = require('../services/teganganListrikService');

/**
 * Create a new Tegangan Listrik record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createTeganganListrik = async (req, res) => {
  try {
    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Photo is required' });
    }
    
    const { towerId, kategori, nilaiInput } = req.body;
    
    // Check for required fields
    if (!towerId) {
      return res.status(400).json({ message: 'Tower ID is required' });
    }
    
    if (!kategori) {
      return res.status(400).json({ message: 'Kategori is required' });
    }
    
    if (!nilaiInput && nilaiInput !== '0') {
      return res.status(400).json({ message: 'Nilai Input is required' });
    }
    
    // Validate kategori is a valid enum value
    const validKategori = ['RN', 'TN', 'SN', 'RT', 'ST', 'RS', 'GN', 'N', 'R', 'S', 'T'];
    if (!validKategori.includes(kategori)) {
      return res.status(400).json({ 
        message: 'Invalid kategori. Must be one of: ' + validKategori.join(', ') 
      });
    }
    
    // Validate nilaiInput is a valid float
    const parsedInput = parseFloat(nilaiInput);
    if (isNaN(parsedInput)) {
      return res.status(400).json({ message: 'nilaiInput must be a valid number' });
    }
    
    const userId = req.user.id;
    
    // Process the request
    console.log('Creating tegangan listrik with data:', {
      towerId,
      kategori,
      nilaiInput: parsedInput,
      userId
    });
    
    const result = await teganganListrikService.createTeganganListrik(req.body, req.file, userId);
    
    res.status(201).json({
      message: 'Tegangan listrik data created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in createTeganganListrik controller:', error);
    
    // Send appropriate error response based on error type
    if (error.message.includes('not found')) {
      return res.status(404).json({ 
        message: error.message
      });
    }
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        message: 'A record with this data already exists'
      });
    }
    
    if (error.code === 'P2003') {
      return res.status(400).json({
        message: 'Referenced record does not exist'
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to create tegangan listrik data', 
      error: error.message 
    });
  }
};

/**
 * Get all Tegangan Listrik records
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllTeganganListrik = async (req, res) => {
  try {
    const result = await teganganListrikService.getAllTeganganListrik(req.query);
    
    res.status(200).json({
      message: 'Tegangan listrik data retrieved successfully',
      ...result
    });
  } catch (error) {
    console.error('Error in getAllTeganganListrik controller:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve tegangan listrik data', 
      error: error.message 
    });
  }
};

/**
 * Get a Tegangan Listrik record by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTeganganListrikById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Valid ID is required' });
    }
    
    const result = await teganganListrikService.getTeganganListrikById(id);
    
    if (!result) {
      return res.status(404).json({ message: 'Tegangan listrik data not found' });
    }
    
    res.status(200).json({
      message: 'Tegangan listrik data retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in getTeganganListrikById controller:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve tegangan listrik data', 
      error: error.message 
    });
  }
};

module.exports = {
  createTeganganListrik,
  getAllTeganganListrik,
  getTeganganListrikById
};