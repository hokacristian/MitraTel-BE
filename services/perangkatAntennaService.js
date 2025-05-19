// Updated perangkatAntennaService.js with job queue implementation

const prisma = require('../configs/prisma');
const imageKitService = require('./imageKitService');
const mlApiService = require('./mlApiService');

/**
 * Create initial Perangkat Antenna record with PENDING status including photo URLs
 * @param {Object} data Form data
 * @param {Array<Object>} files Uploaded files (processed immediately)
 * @param {String} userId Current user ID
 * @returns {Promise<Object>} Created initial Perangkat Antenna record with photo URLs
 */
const createInitialRecord = async (data, files, userId) => {
  const { towerId, latitude, longitude, height } = data;
  
  try {
    // Verify that the tower exists first
    const tower = await prisma.tower.findUnique({
      where: { id: parseInt(towerId) }
    });

    if (!tower) {
      throw new Error(`Tower with ID ${towerId} not found`);
    }

    // Upload photos immediately to get URLs for the response
    console.log('Uploading photos to ImageKit...');
    const uploadPromises = files.map(file => 
      imageKitService.uploadImage(file.buffer, file.originalname)
    );
    
    // Wait for all uploads to complete
    const uploadResults = await Promise.all(uploadPromises);
    console.log(`Successfully uploaded ${uploadResults.length} photos to ImageKit`);

    // Create the initial record with PENDING status and basic data
    const initialRecord = await prisma.$transaction(async (prisma) => {
      // Create the main record
      const record = await prisma.perangkatAntenna.create({
        data: {
          tower: {
            connect: { id: parseInt(towerId) }
          },
          user: {
            connect: { id: userId }
          },
          status: 'PENDING', // Initial status
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          height: height ? parseFloat(height) : 0, // Use provided height or default to 0
          // Default values for antenna counts are already set in the schema
        }
      });
      
      // Create photo records with the uploaded image URLs
      const photoRecords = [];
      for (const uploadResult of uploadResults) {
        const photo = await prisma.perangkatFoto.create({
          data: {
            url: uploadResult.url,
            perangkatAntenna: {
              connect: { id: record.id }
            }
          }
        });
        photoRecords.push(photo);
      }
      
      // Return the record with photos
      return {
        ...record,
        fotos: photoRecords
      };
    }, {
      // Use a longer timeout for the transaction since we're creating multiple records
      timeout: 15000 
    });
    
    // Include tower and user data in the response
    const completeRecord = await prisma.perangkatAntenna.findUnique({
      where: { id: initialRecord.id },
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
    
    return completeRecord;
  } catch (error) {
    console.error('Error creating initial record:', error);
    throw error;
  }
};

/**
 * Process the Perangkat Antenna record in the background
 * @param {Number} recordId The ID of the initial record
 * @param {Object} data Form data
 * @param {Array<Object>} files Uploaded files
 * @param {String} userId Current user ID
 * @returns {Promise<void>}
 */
const processInBackground = async (recordId, data, files, userId) => {
  try {
    const { towerId, latitude: userLatitude, longitude: userLongitude, height: userProvidedHeight } = data;
    
    console.log(`Starting background processing for record ID ${recordId}`);
    
    // Update status to IN_PROGRESS
    await prisma.perangkatAntenna.update({
      where: { id: recordId },
      data: { status: 'IN_PROGRESS' }
    });
    
    // Extract file buffers for ML API
    const photoBuffers = files.map(file => file.buffer);
    
    // Process only ML API since images are already uploaded
    console.log('Starting ML API call...');
    
    try {
      // Execute ML API call
      const mlResponse = await mlApiService.analyzePerangkatAntenna(photoBuffers);
      
      console.log('ML Response for PerangkatAntenna:', JSON.stringify(mlResponse));
      
      // Initialize with values from request body
      let height = parseFloat(userProvidedHeight) || 0;
      let latitude = parseFloat(userLatitude);
      let longitude = parseFloat(userLongitude);
      let jumlahAntenaRF = 0;
      let jumlahAntenaRRU = 0;
      let jumlahAntenaMW = 0;
      
      // Extract latitude if available from ML response (now "latitude" is "Ketinggian")
if (mlResponse && mlResponse.height !== undefined) {
  let detectedHeight;
  
  if (typeof mlResponse.height === 'number') {
    detectedHeight = mlResponse.height;
  } else if (typeof mlResponse.height === 'string') {
    detectedHeight = parseFloat(mlResponse.height.replace(/"/g, ''));
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
      
      // Extract height if available and valid from ML response (now "Ketinggian" is "Bujur")
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
      
      // Extract longitude if available from ML response (now "longitude" is "Lintang")
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
      
      // Extract antenna counts if available - format is now lowercase with underscores
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
      
      // Update the record with ML results and set status to COMPLETED
      await prisma.perangkatAntenna.update({
        where: { id: recordId },
        data: {
          status: 'COMPLETED',
          latitude: latitude,
          longitude: longitude,
          height: height,
          jumlahAntenaRF,
          jumlahAntenaRRU,
          jumlahAntenaMW,
          totalAntena
        }
      });
      
      // Log the successful completion
      console.log(`Background processing completed successfully for record ID ${recordId}`);
    } catch (mlError) {
      console.error('ML or image processing error:', mlError);
      
      // Update status to ERROR
      await prisma.perangkatAntenna.update({
        where: { id: recordId },
        data: { 
          status: 'ERROR'
        }
      });
      
      throw mlError;
    }
  } catch (error) {
    console.error(`Background processing failed for record ID ${recordId}:`, error);
    
    // Make sure the status is set to ERROR
    try {
      await prisma.perangkatAntenna.update({
        where: { id: recordId },
        data: { status: 'ERROR' }
      });
    } catch (updateError) {
      console.error('Failed to update status to ERROR:', updateError);
    }
    
    throw error;
  }
};

/**
 * Get all Perangkat Antenna records
 * @param {Object} query Query parameters
 * @returns {Promise<Object>} Paginated Perangkat Antenna records
 */
const getAllPerangkatAntennas = async (query) => {
  try {
    const { towerId, wilayahId, page = 1, limit = 10, status } = query;
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
    
    // Filter by status if provided
    if (status) {
      whereClause.status = status;
    } else {
      // By default, only show COMPLETED records
      whereClause.status = 'COMPLETED';
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
    const record = await prisma.perangkatAntenna.findUnique({
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
    
    // If record is IN_PROGRESS or PENDING, don't return detailed data
    if (record && (record.status === 'IN_PROGRESS' || record.status === 'PENDING')) {
      const { fotos, ...recordWithoutDetails } = record;
      return {
        ...recordWithoutDetails,
        fotos: [], // Empty array instead of actual photos
        message: `Data is currently being processed (status: ${record.status})`
      };
    }
    
    return record;
  } catch (error) {
    console.error('Error in getPerangkatAntennaById:', error);
    throw error;
  }
};

module.exports = {
  createInitialRecord,
  processInBackground,
  getAllPerangkatAntennas,
  getPerangkatAntennaById
};