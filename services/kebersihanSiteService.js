const prisma = require('../configs/prisma');
const imageKitService = require('./imageKitService');
const mlApiService = require('./mlApiService');

/**
 * Create a new Kebersihan Site record with photos
 * @param {Object} data Form data
 * @param {Number} data.wilayahId Wilayah ID
 * @param {Number} data.towerId Tower ID
 * @param {Array<Object>} files Uploaded files
 * @param {String} userId Current user ID
 * @returns {Promise<Object>} Created Kebersihan Site
 */
const createKebersihanSite = async (data, files, userId) => {
  const { wilayahId, towerId } = data;
  
  try {
    // 1. Prepare photo buffers for ML API
    const photoBuffers = files.map(file => file.buffer);
    
    // 2. Send photos to ML API
    const mlResponse = await mlApiService.analyzeKebersihanSite(photoBuffers);
    
    // 3. Start database transaction
    return await prisma.$transaction(async (prisma) => {
      // 4. Create Kebersihan Site record
      const kebersihanSite = await prisma.kebersihanSite.create({
        data: {
          towerId: parseInt(towerId),
          userId,
          classification: mlResponse.classification,
          tanamanLiar: mlResponse.tanaman_liar,
          lumut: mlResponse.lumut,
          genanganAir: mlResponse.genangan_air,
          nodaDinding: mlResponse.noda_dinding,
          retakan: mlResponse.retakan,
          sampah: mlResponse.sampah
        }
      });
      
      // 5. Upload photos to ImageKit and create photo records
      const photoPromises = files.map(async (file) => {
        const uploadResult = await imageKitService.uploadImage(file.buffer, file.originalname);
        
        return prisma.kebersihanFoto.create({
          data: {
            url: uploadResult.url,
            kebersihanId: kebersihanSite.id
          }
        });
      });
      
      await Promise.all(photoPromises);
      
      // 6. Return created record with photos
      return prisma.kebersihanSite.findUnique({
        where: { id: kebersihanSite.id },
        include: {
          fotos: true,
          tower: true
        }
      });
    });
  } catch (error) {
    console.error('Error in createKebersihanSite:', error);
    throw error;
  }
};

/**
 * Get all Kebersihan Site records
 * @param {Object} query Query parameters
 * @returns {Promise<Array<Object>>} List of Kebersihan Site records
 */
const getAllKebersihanSites = async (query) => {
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
      prisma.kebersihanSite.findMany({
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
      prisma.kebersihanSite.count({ where: whereClause })
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
    console.error('Error in getAllKebersihanSites:', error);
    throw error;
  }
};

/**
 * Get a Kebersihan Site record by ID
 * @param {Number} id Kebersihan Site ID
 * @returns {Promise<Object>} Kebersihan Site record
 */
const getKebersihanSiteById = async (id) => {
  try {
    return prisma.kebersihanSite.findUnique({
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
    console.error('Error in getKebersihanSiteById:', error);
    throw error;
  }
};

module.exports = {
  createKebersihanSite,
  getAllKebersihanSites,
  getKebersihanSiteById
};