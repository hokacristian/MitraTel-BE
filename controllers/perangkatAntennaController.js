const perangkatAntennaService = require('../services/perangkatAntennaService');

const createPerangkatAntenna = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Photos are required' });
    }
    
    const { towerId, latitude, longitude, height } = req.body;
    
    if (!towerId || !latitude || !longitude || !height) {
      return res.status(400).json({ message: 'Tower ID, latitude, longitude, and height are required' });
    }
    
    const userId = req.user.id;
    
    const result = await perangkatAntennaService.createPerangkatAntenna(req.body, req.files, userId);
    
    res.status(201).json({
      message: 'Perangkat antenna data created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in createPerangkatAntenna controller:', error);
    res.status(500).json({ message: 'Failed to create perangkat antenna data', error: error.message });
  }
};

const getAllPerangkatAntennas = async (req, res) => {
  try {
    const result = await perangkatAntennaService.getAllPerangkatAntennas(req.query);
    
    res.status(200).json({
      message: 'Perangkat antenna data retrieved successfully',
      ...result
    });
  } catch (error) {
    console.error('Error in getAllPerangkatAntennas controller:', error);
    res.status(500).json({ message: 'Failed to retrieve perangkat antenna data', error: error.message });
  }
};

const getPerangkatAntennaById = async (req, res) => {
  try {
    const { id } = req.params;
    
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
    res.status(500).json({ message: 'Failed to retrieve perangkat antenna data', error: error.message });
  }
};

module.exports = {
  createPerangkatAntenna,
  getAllPerangkatAntennas,
  getPerangkatAntennaById
};