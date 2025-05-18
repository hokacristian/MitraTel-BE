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
    const towerId = parseInt(id);
    
    // Dapatkan data tower dengan wilayah
    const tower = await prisma.tower.findUnique({
      where: { id: towerId },
      include: {
        wilayah: true
      }
    });
    
    if (!tower) {
      return res.status(404).json({ message: 'Tower not found' });
    }
    
    // Dapatkan data terbaru dari ketiga kategori
    const [latestKebersihan, latestPerangkat, latestTegangan] = await Promise.all([
      // Data kebersihan terbaru
      prisma.kebersihanSite.findFirst({
        where: { towerId },
        orderBy: { createdAt: 'desc' },
        include: {
          fotos: true,
          user: {
            select: {
              id: true,
              name: true,
              username: true
            }
          }
        }
      }),
      
      // Data perangkat antenna terbaru
      prisma.perangkatAntenna.findFirst({
        where: { towerId },
        orderBy: { createdAt: 'desc' },
        include: {
          fotos: true,
          user: {
            select: {
              id: true,
              name: true,
              username: true
            }
          }
        }
      }),
      
      // Data tegangan listrik terbaru
      prisma.teganganListrik.findFirst({
        where: { towerId },
        orderBy: { createdAt: 'desc' },
        include: {
          fotos: true,
          user: {
            select: {
              id: true,
              name: true,
              username: true
            }
          }
        }
      })
    ]);
    
    res.status(200).json({
      message: 'Tower retrieved successfully',
      data: {
        ...tower,
        latestData: {
          kebersihan: latestKebersihan || null,
          perangkat: latestPerangkat || null,
          tegangan: latestTegangan || null
        }
      }
    });
  } catch (error) {
    console.error('Error in getTowerById:', error);
    res.status(500).json({ message: 'Failed to retrieve tower', error: error.message });
  }
};

const getTowerCount = async (req, res) => {
  try {
    const { wilayahId } = req.query;
    
    const whereClause = {};
    if (wilayahId) {
      whereClause.wilayahId = parseInt(wilayahId);
    }
    
    const count = await prisma.tower.count({
      where: whereClause
    });
    
    res.status(200).json({
      message: 'Tower count retrieved successfully',
      data: { count }
    });
  } catch (error) {
    console.error('Error in getTowerCount:', error);
    res.status(500).json({ message: 'Failed to retrieve tower count', error: error.message });
  }
};

module.exports = {
  createTower,
  getAllTowers,
  getTowerById,
  getTowerCount
};