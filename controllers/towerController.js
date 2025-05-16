const prisma = require('../configs/prisma');

const createTower = async (req, res) => {
  try {
    const { nama, latitude, longitude, wilayahId } = req.body;
    
    if (!nama || !latitude || !longitude || !wilayahId) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if wilayah exists
    const wilayah = await prisma.wilayah.findUnique({
      where: { id: parseInt(wilayahId) }
    });
    
    if (!wilayah) {
      return res.status(404).json({ message: 'Wilayah not found' });
    }
    
    const tower = await prisma.tower.create({
      data: {
        nama,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        wilayahId: parseInt(wilayahId)
      }
    });
    
    res.status(201).json({
      message: 'Tower created successfully',
      data: tower
    });
  } catch (error) {
    console.error('Error in createTower:', error);
    res.status(500).json({ message: 'Failed to create tower', error: error.message });
  }
};

const getAllTowers = async (req, res) => {
  try {
    const { wilayahId } = req.query;
    
    const whereClause = {};
    if (wilayahId) {
      whereClause.wilayahId = parseInt(wilayahId);
    }
    
    const towers = await prisma.tower.findMany({
      where: whereClause,
      include: {
        wilayah: true
      }
    });
    
    res.status(200).json({
      message: 'Towers retrieved successfully',
      data: towers
    });
  } catch (error) {
    console.error('Error in getAllTowers:', error);
    res.status(500).json({ message: 'Failed to retrieve towers', error: error.message });
  }
};

const getTowerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tower = await prisma.tower.findUnique({
      where: { id: parseInt(id) },
      include: {
        wilayah: true
      }
    });
    
    if (!tower) {
      return res.status(404).json({ message: 'Tower not found' });
    }
    
    res.status(200).json({
      message: 'Tower retrieved successfully',
      data: tower
    });
  } catch (error) {
    console.error('Error in getTowerById:', error);
    res.status(500).json({ message: 'Failed to retrieve tower', error: error.message });
  }
};

module.exports = {
  createTower,
  getAllTowers,
  getTowerById
};