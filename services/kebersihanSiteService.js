// Updated kebersihanSiteService.js to handle the latest ML API response format

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
    // Verify that the tower exists first
    const tower = await prisma.tower.findUnique({
      where: { id: parseInt(towerId) }
    });

    if (!tower) {
      throw new Error(`Tower with ID ${towerId} not found`);
    }

    // 1. Process ML API call and ImageKit uploads in parallel outside of transaction
    // Prepare photo buffers for ML API
    const photoBuffers = files.map(file => file.buffer);
    
    // Execute ML API call and ImageKit uploads in parallel
    const mlApiPromise = mlApiService.analyzeKebersihanSite(photoBuffers);
    const imageKitPromises = files.map(file => 
      imageKitService.uploadImage(file.buffer, file.originalname)
    );
    
    // Wait for all promises to resolve
    const [mlResponse, ...uploadResults] = await Promise.all([
      mlApiPromise,
      ...imageKitPromises
    ]);

    console.log('ML Response for KebersihanSite:', JSON.stringify(mlResponse));

    // 2. Extract values from ML response based on the NEW documented format
    // Format: { output: { classification, counts: { tanaman_liar, lumut, ... }, files: [...] } }
    const output = mlResponse.output || {};
    const counts = output.counts || {};
    
    // Initialize default values
    let classification = 'unclean'; // Default to unclean if not specified
    let tanamanLiar = 0;
    let lumut = 0;
    let genanganAir = 0;
    let nodaDinding = 0;
    let retakan = 0;
    let sampah = 0;
    
    // Extract values if they exist
    if (output.classification) {
      classification = output.classification.toLowerCase(); // Convert to lowercase for consistency
    }
    
    if (typeof counts.tanaman_liar === 'number') {
      tanamanLiar = counts.tanaman_liar;
    }
    
    if (typeof counts.lumut === 'number') {
      lumut = counts.lumut;
    }
    
    if (typeof counts.genangan_air === 'number') {
      genanganAir = counts.genangan_air;
    }
    
    if (typeof counts.noda_dinding === 'number') {
      nodaDinding = counts.noda_dinding;
    }
    
    if (typeof counts.retakan === 'number') {
      retakan = counts.retakan;
    }
    
    // Combine sampah and sampah_daun if both exist
    if (typeof counts.sampah === 'number') {
      sampah = counts.sampah;
    }
    
    if (typeof counts.sampah_daun === 'number') {
      sampah += counts.sampah_daun; // Add sampah_daun to the sampah count
    }
    
    // 3. Start database transaction with increased timeout
    return await prisma.$transaction(async (prisma) => {
      // 4. Create Kebersihan Site record
      const kebersihanSite = await prisma.kebersihanSite.create({
        data: {
          tower: {
            connect: { id: parseInt(towerId) }
          },
          user: {
            connect: { id: userId }
          },
          classification,
          tanamanLiar,
          lumut,
          genanganAir,
          nodaDinding,
          retakan,
          sampah
        }
      });
      
      // 5. Create photo records with the pre-uploaded images
      const photoPromises = uploadResults.map(uploadResult => 
        prisma.kebersihanFoto.create({
          data: {
            url: uploadResult.url,
            kebersihanSite: {
              connect: { id: kebersihanSite.id }
            }
          }
        })
      );
      
      await Promise.all(photoPromises);
      
      // 6. Return created record with photos
      return prisma.kebersihanSite.findUnique({
        where: { id: kebersihanSite.id },
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
    }, {
      // Increase transaction timeout to 10 seconds
      timeout: 10000
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