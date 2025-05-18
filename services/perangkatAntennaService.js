// Perbaikan pada perangkatAntennaService.js untuk menangani respons ketinggian dengan benar

const prisma = require('../configs/prisma');
const imageKitService = require('./imageKitService');
const mlApiService = require('./mlApiService');

/**
 * Create a new Perangkat Antenna record with photos
 * @param {Object} data Form data
 * @param {Number} data.towerId Tower ID
 * @param {Number} data.latitude Latitude
 * @param {Number} data.longitude Longitude
 * @param {Number} data.height Height (optional, will be detected by ML if not provided)
 * @param {Array<Object>} files Uploaded files
 * @param {String} userId Current user ID
 * @returns {Promise<Object>} Created Perangkat Antenna
 */
const createPerangkatAntenna = async (data, files, userId) => {
  const { towerId, latitude: userLatitude, longitude: userLongitude, height: userProvidedHeight } = data;
  
  try {
    // Verify that the tower exists first
    const tower = await prisma.tower.findUnique({
      where: { id: parseInt(towerId) }
    });

    if (!tower) {
      throw new Error(`Tower with ID ${towerId} not found`);
    }

    // Process ML API call and ImageKit uploads in parallel
    const photoBuffers = files.map(file => file.buffer);
    
    const mlApiPromise = mlApiService.analyzePerangkatAntenna(photoBuffers);
    const imageKitPromises = files.map(file => 
      imageKitService.uploadImage(file.buffer, file.originalname)
    );
    
    const [mlResponse, ...uploadResults] = await Promise.all([
      mlApiPromise,
      ...imageKitPromises
    ]);

    console.log('ML Response for PerangkatAntenna:', JSON.stringify(mlResponse));

    // Initialize with values from request body
    let height = parseFloat(userProvidedHeight) || 0;
    let latitude = parseFloat(userLatitude);
    let longitude = parseFloat(userLongitude);
    let jumlahAntenaRF = 0;
    let jumlahAntenaRRU = 0;
    let jumlahAntenaMW = 0;
    
    // Extract height if available and valid from ML response
    if (mlResponse && mlResponse.Ketinggian !== undefined) {
      let detectedHeight;
      
      if (typeof mlResponse.Ketinggian === 'number') {
        detectedHeight = mlResponse.Ketinggian;
      } else if (typeof mlResponse.Ketinggian === 'string') {
        detectedHeight = parseFloat(mlResponse.Ketinggian.replace(/"/g, ''));
      }
      
      console.log('Detected height from ML:', detectedHeight);
      
      // Use detected height if valid and not 0
      if (!isNaN(detectedHeight) && detectedHeight !== 0) {
        height = detectedHeight;
        console.log('Using ML-detected height:', height);
      } else {
        console.log('Using user-provided height:', height);
      }
    }
    
    // Extract latitude if available from ML response
    if (mlResponse && mlResponse.latitude !== undefined) {
      let detectedLatitude;
      
      if (typeof mlResponse.latitude === 'number') {
        detectedLatitude = mlResponse.latitude;
      } else if (typeof mlResponse.latitude === 'string') {
        detectedLatitude = parseFloat(mlResponse.latitude.replace(/"/g, ''));
      }
      
      console.log('Detected latitude from ML:', detectedLatitude);
      
      // Use detected latitude if valid and not 0
      if (!isNaN(detectedLatitude) && detectedLatitude !== 0) {
        latitude = detectedLatitude;
        console.log('Using ML-detected latitude:', latitude);
      } else {
        console.log('Using user-provided latitude:', latitude);
      }
    }
    
    // Extract longitude if available from ML response
    if (mlResponse && mlResponse.longitude !== undefined) {
      let detectedLongitude;
      
      if (typeof mlResponse.longitude === 'number') {
        detectedLongitude = mlResponse.longitude;
      } else if (typeof mlResponse.longitude === 'string') {
        detectedLongitude = parseFloat(mlResponse.longitude.replace(/"/g, ''));
      }
      
      console.log('Detected longitude from ML:', detectedLongitude);
      
      // Use detected longitude if valid and not 0
      if (!isNaN(detectedLongitude) && detectedLongitude !== 0) {
        longitude = detectedLongitude;
        console.log('Using ML-detected longitude:', longitude);
      } else {
        console.log('Using user-provided longitude:', longitude);
      }
    }
    
    // Extract antenna counts if available
    if (mlResponse && mlResponse.antenna_counts) {
      const counts = mlResponse.antenna_counts;
      
      if (typeof counts.radio_freq_unit === 'number') {
        jumlahAntenaRF = counts.radio_freq_unit;
      }
      
      if (typeof counts.remote_radio_unit === 'number') {
        jumlahAntenaRRU = counts.remote_radio_unit;
      }
      
      if (typeof counts.microwave === 'number') {
        jumlahAntenaMW = counts.microwave;
      }
    }
    
    // Calculate total antenna count
    const totalAntena = jumlahAntenaRF + jumlahAntenaRRU + jumlahAntenaMW;
    
    // Start database transaction
    return await prisma.$transaction(async (prisma) => {
      // Create Perangkat Antenna record with final values
      const perangkatAntenna = await prisma.perangkatAntenna.create({
        data: {
          tower: {
            connect: { id: parseInt(towerId) }
          },
          user: {
            connect: { id: userId }
          },
          latitude: latitude,
          longitude: longitude,
          height: height,
          jumlahAntenaRF,
          jumlahAntenaRRU,
          jumlahAntenaMW,
          totalAntena
        }
      });
      
      // Create photo records with the pre-uploaded images
      const photoPromises = uploadResults.map(uploadResult => 
        prisma.perangkatFoto.create({
          data: {
            url: uploadResult.url,
            perangkatAntenna: {
              connect: { id: perangkatAntenna.id }
            }
          }
        })
      );
      
      await Promise.all(photoPromises);
      
      // Return created record with photos
      return prisma.perangkatAntenna.findUnique({
        where: { id: perangkatAntenna.id },
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
      timeout: 10000
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