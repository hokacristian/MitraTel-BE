const kebersihanSiteService = require('../services/kebersihanSiteService');

const createKebersihanSite = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Photos are required' });
    }
    
    const { wilayahId, towerId } = req.body;
    
    if (!towerId) {
      return res.status(400).json({ message: 'Tower ID is required' });
    }
    
    const userId = req.user.id;
    
    const result = await kebersihanSiteService.createKebersihanSite(req.body, req.files, userId);
    
    res.status(201).json({
      message: 'Kebersihan site data created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in createKebersihanSite controller:', error);
    res.status(500).json({ message: 'Failed to create kebersihan site data', error: error.message });
  }
};

const getAllKebersihanSites = async (req, res) => {
  try {
    const result = await kebersihanSiteService.getAllKebersihanSites(req.query);
    
    res.status(200).json({
      message: 'Kebersihan site data retrieved successfully',
      ...result
    });
  } catch (error) {
    console.error('Error in getAllKebersihanSites controller:', error);
    res.status(500).json({ message: 'Failed to retrieve kebersihan site data', error: error.message });
  }
};

const getKebersihanSiteById = async (req, res) => {
  try {
    const { id } = req.params;
    
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
    res.status(500).json({ message: 'Failed to retrieve kebersihan site data', error: error.message });
  }
};

module.exports = {
  createKebersihanSite,
  getAllKebersihanSites,
  getKebersihanSiteById
};