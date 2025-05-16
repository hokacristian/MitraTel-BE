const prisma = require('../configs/prisma');

const createWilayah = async (req, res) => {
  try {
    const { nama } = req.body;
    
    if (!nama) {
      return res.status(400).json({ message: 'Nama wilayah is required' });
    }
    
    const wilayah = await prisma.wilayah.create({
      data: { nama }
    });
    
    res.status(201).json({
      message: 'Wilayah created successfully',
      data: wilayah
    });
  } catch (error) {
    console.error('Error in createWilayah:', error);
    res.status(500).json({ message: 'Failed to create wilayah', error: error.message });
  }
};

const getAllWilayah = async (req, res) => {
  try {
    const wilayah = await prisma.wilayah.findMany({
      include: {
        towers: {
          select: {
            id: true,
            nama: true
          }
        }
      }
    });
    
    res.status(200).json({
      message: 'Wilayah retrieved successfully',
      data: wilayah
    });
  } catch (error) {
    console.error('Error in getAllWilayah:', error);
    res.status(500).json({ message: 'Failed to retrieve wilayah', error: error.message });
  }
};

const getWilayahById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const wilayah = await prisma.wilayah.findUnique({
      where: { id: parseInt(id) },
      include: {
        towers: true
      }
    });
    
    if (!wilayah) {
      return res.status(404).json({ message: 'Wilayah not found' });
    }
    
    res.status(200).json({
      message: 'Wilayah retrieved successfully',
      data: wilayah
    });
  } catch (error) {
    console.error('Error in getWilayahById:', error);
    res.status(500).json({ message: 'Failed to retrieve wilayah', error: error.message });
  }
};

module.exports = {
  createWilayah,
  getAllWilayah,
  getWilayahById
};