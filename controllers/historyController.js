const prisma = require('../configs/prisma');

/**
 * Get user activity history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, type } = req.query;
    const skip = (page - 1) * parseInt(limit);
    
    let kebersihanData = [];
    let perangkatData = [];
    let teganganData = [];
    let totalKebersihan = 0;
    let totalPerangkat = 0;
    let totalTegangan = 0;
    
    // Jika tidak ada filter type atau type=kebersihan, ambil data kebersihan
    if (!type || type === 'kebersihan') {
      [kebersihanData, totalKebersihan] = await Promise.all([
        prisma.kebersihanSite.findMany({
          where: { userId },
          include: {
            fotos: true,
            tower: {
              include: {
                wilayah: true
              }
            }
          },
          skip: type ? skip : 0,
          take: type ? parseInt(limit) : 5,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.kebersihanSite.count({ where: { userId } })
      ]);
    }
    
    // Jika tidak ada filter type atau type=perangkat, ambil data perangkat
    if (!type || type === 'perangkat') {
      [perangkatData, totalPerangkat] = await Promise.all([
        prisma.perangkatAntenna.findMany({
          where: { userId },
          include: {
            fotos: true,
            tower: {
              include: {
                wilayah: true
              }
            }
          },
          skip: type ? skip : 0,
          take: type ? parseInt(limit) : 5,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.perangkatAntenna.count({ where: { userId } })
      ]);
    }
    
    // Jika tidak ada filter type atau type=tegangan, ambil data tegangan
    if (!type || type === 'tegangan') {
      [teganganData, totalTegangan] = await Promise.all([
        prisma.teganganListrik.findMany({
          where: { userId },
          include: {
            fotos: true,
            tower: {
              include: {
                wilayah: true
              }
            }
          },
          skip: type ? skip : 0,
          take: type ? parseInt(limit) : 5,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.teganganListrik.count({ where: { userId } })
      ]);
    }
    
    // Menentukan total data dan total halaman berdasarkan filter
    let total, totalPages;
    
    if (type === 'kebersihan') {
      total = totalKebersihan;
      totalPages = Math.ceil(total / parseInt(limit));
    } else if (type === 'perangkat') {
      total = totalPerangkat;
      totalPages = Math.ceil(total / parseInt(limit));
    } else if (type === 'tegangan') {
      total = totalTegangan;
      totalPages = Math.ceil(total / parseInt(limit));
    } else {
      // Jika tidak ada filter, ambil semua data tapi dalam jumlah terbatas
      total = totalKebersihan + totalPerangkat + totalTegangan;
      // Untuk metode paginasi yang lebih kompleks, sebaiknya diubah
      totalPages = 1; 
    }
    
    res.status(200).json({
      message: 'User history retrieved successfully',
      data: {
        kebersihan: kebersihanData,
        perangkat: perangkatData,
        tegangan: teganganData
      },
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      }
    });
  } catch (error) {
    console.error('Error in getUserHistory:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve user history', 
      error: error.message 
    });
  }
};

module.exports = {
  getUserHistory
};