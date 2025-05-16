const prisma = require('../configs/prisma');
const imageKitService = require('./imageKitService');
const mlApiService = require('./mlApiService');

/**
 * Create a new Perangkat Antenna record with photos
 * @param {Object} data Form data
 * @param {Number} data.wilayahId Wilayah ID
 * @param {Number} data.towerId Tower ID
 * @param {Number} data.latitude Latitude
 * @param {Number} data.longitude Longitude
 * @param {Number} data.height Height
 * @param {Array<Object>} files Uploaded files
 * @param {String} userId Current user ID
 * @returns {Promise<Object>} Created Perangkat Antenna
 */
const createPerangkatAntenna = async (data, files, userId) => {
  const { wilayahId, towerId, latitude, longitude, height } = data;
  
  try {
    // 1. Prepare photo buffers for ML API
    const photoBuffers = files.map(file => file.buffer);
    
    // 2. Send photos to ML API
    const mlResponse = await mlApiService.analyzePerangkatAntenna(photoBuffers);
    
    // 3. Start database transaction
    return await prisma.$transaction(async (prisma) => {
      // 4. Create Perangkat Antenna record
      const perangkatAntenna = await prisma.perangkatAntenna.create({
        data: {
          towerId: parseInt(towerId),
          userId,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          height: parseFloat(height),
          jumlahAntenaRF: mlResponse.jumlahAntenaRF,
          jumlahAntenaRRU: mlResponse.jumlahAntenaRRU,
          jumlahAntenaRWU: mlResponse.jumlahAntenaRWU,
          totalAntena: mlResponse.totalAntena
        }
      });
      
      // 5. Upload photos to ImageKit and create photo records
      const photoPromises = files.map(async (file) => {
        const uploadResult = await imageKitService.uploadImage(file.buffer, file.originalname);
        
        return prisma.perangkatFoto.create({
          data: {
            url: uploadResult.url,
            perangkatId: perangkatAntenna.id
          }
        });
      });
      
      await Promise.all(photoPromises);
      
      // 6. Return created record with photos
      return prisma.perangkatAntenna.findUnique({
        where: { id: perangkatAntenna.id },
        include: {
          fotos: true,
          tower: true
        }
      });
    });
  } catch (error) {
    console.error('Error in createPerangkatAntenna:', error);
    throw error;
  }
};

/**
 * Get all Perangkat Antenna records
 * @param {Object} query Query parameters
 * @returns {Promise<Array<Object>>} List of Perangkat Antenna records
 */
const getAllPerangkatAntennas = async (query) => {
  try {
    const { towerId, wilayahId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * parseInt(limit);
    
    const whereClause = {};
    
    if (towerId) {
      whereClause.towerId = parseInt(towerId);
    }
    
    if (wilayahId) {
      whereClause.tower = {
        wilayahId: parseInt(wilayahId)
      };
    }
    
    const [data, total] = await Promise.all([
      prisma.perangkatAntenna.findMany({
        where: whereClause,
        include: {
          fotos: true,
          tower: {
            include: {
              wilayah: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              username: true
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.perangkatAntenna.count({ where: whereClause })
    ]);
    
    return {
      data,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  } catch (error) {
    console.error('Error in getAllPerangkatAntennas:', error);
    throw error;
  }
};

/**
 * Get a Perangkat Antenna record by ID
 * @param {Number} id Perangkat Antenna ID
 * @returns {Promise<Object>} Perangkat Antenna record
 */
const getPerangkatAntennaById = async (id) => {
  try {
    return prisma.perangkatAntenna.findUnique({
      where: { id: parseInt(id) },
      include: {
        fotos: true,
        tower: {
          include: {
            wilayah: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      }
    });
  } catch (error) {
    console.error('Error in getPerangkatAntennaById:', error);
    throw error;
  }
};

module.exports = {
  createPerangkatAntenna,
  getAllPerangkatAntennas,
  getPerangkatAntennaById
};