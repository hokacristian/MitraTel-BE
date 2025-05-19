// Updated kebersihanSiteService.js with job queue implementation

const prisma = require('../configs/prisma');
const imageKitService = require('./imageKitService');
const mlApiService = require('./mlApiService');

/**
 * Create initial Kebersihan Site record with PENDING status including photo URLs
 * @param {Object} data Form data
 * @param {Number} data.towerId Tower ID
 * @param {Array<Object>} files Uploaded files
 * @param {String} userId Current user ID
 * @returns {Promise<Object>} Created initial Kebersihan Site with photo URLs
 */
const createInitialRecord = async (data, files, userId) => {
  const { towerId } = data;
  
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
      const record = await prisma.kebersihanSite.create({
        data: {
          tower: {
            connect: { id: parseInt(towerId) }
          },
          user: {
            connect: { id: userId }
          },
          status: 'PENDING', // Initial status
          // Default values are already set in the schema for these fields
        }
      });
      
      // Create photo records with the uploaded image URLs
      const photoRecords = [];
      for (const uploadResult of uploadResults) {
        const photo = await prisma.kebersihanFoto.create({
          data: {
            url: uploadResult.url,
            kebersihanSite: {
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
    const completeRecord = await prisma.kebersihanSite.findUnique({
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
 * Process the Kebersihan Site record in the background
 * @param {Number} recordId The ID of the initial record
 * @param {Object} data Form data
 * @param {Array<Object>} files Uploaded files
 * @param {String} userId Current user ID
 * @returns {Promise<void>}
 */
const processInBackground = async (recordId, data, files, userId) => {
  try {
    console.log(`Starting background processing for record ID ${recordId}`);
    
    // Update status to IN_PROGRESS
    await prisma.kebersihanSite.update({
      where: { id: recordId },
      data: { status: 'IN_PROGRESS' }
    });
    
    // Extract file buffers for ML API
    const photoBuffers = files.map(file => file.buffer);
    
    try {
      // Execute ML API call
      console.log('Starting ML API call...');
      const mlResponse = await mlApiService.analyzeKebersihanSite(photoBuffers);
      
      console.log('ML Response for KebersihanSite:', JSON.stringify(mlResponse));

      // Extract values from ML response based on the NEW documented format
      // Format: { output: { classification, counts: { tanaman_liar, lumut, ... }, recommendations: [...] } }
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
      let recommendations = [];
      
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
      
      // Extract recommendations array
      if (output.recommendations && Array.isArray(output.recommendations)) {
        recommendations = output.recommendations;
      }
      
      // Update the record with ML results and set status to COMPLETED
      await prisma.kebersihanSite.update({
        where: { id: recordId },
        data: {
          status: 'COMPLETED',
          classification,
          tanamanLiar,
          lumut,
          genanganAir,
          nodaDinding,
          retakan,
          sampah,
          recommendations // Add the recommendations array
        }
      });
      
      // Log the successful completion
      console.log(`Background processing completed successfully for record ID ${recordId}`);
    } catch (mlError) {
      console.error('ML or image processing error:', mlError);
      
      // Update status to ERROR
      await prisma.kebersihanSite.update({
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
      await prisma.kebersihanSite.update({
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
 * Get all Kebersihan Site records
 * @param {Object} query Query parameters
 * @returns {Promise<Object>} Paginated Kebersihan Site records
 */
const getAllKebersihanSites = async (query) => {
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
    const record = await prisma.kebersihanSite.findUnique({
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
      return {
        ...record,
        message: `Data is currently being processed (status: ${record.status})`
      };
    }
    
    return record;
  } catch (error) {
    console.error('Error in getKebersihanSiteById:', error);
    throw error;
  }
};

module.exports = {
  createInitialRecord,
  processInBackground,
  getAllKebersihanSites,
  getKebersihanSiteById
};