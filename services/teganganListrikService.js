// Updated teganganListrikService.js with job queue implementation

const prisma = require('../configs/prisma');
const imageKitService = require('./imageKitService');
const mlApiService = require('./mlApiService');

/**
 * Create initial Tegangan Listrik record with PENDING status including photo URL
 * @param {Object} data Form data
 * @param {Object} file Uploaded file (processed immediately)
 * @param {String} userId Current user ID
 * @returns {Promise<Object>} Created initial Tegangan Listrik record with photo URL
 */
const createInitialRecord = async (data, file, userId) => {
  const { towerId, kategori, nilaiInput } = data;
  
  try {
    // Verify that the tower exists first
    const tower = await prisma.tower.findUnique({
      where: { id: parseInt(towerId) }
    });

    if (!tower) {
      throw new Error(`Tower with ID ${towerId} not found`);
    }

    // Upload photo immediately to get URL for the response
    console.log('Uploading photo to ImageKit...');
    const uploadResult = await imageKitService.uploadImage(file.buffer, file.originalname);
    console.log('Successfully uploaded photo to ImageKit');

    // Determine the appropriate unit (V or A) based on category
    const satuan = determineSatuan(kategori);
    
    // Create the initial record with PENDING status and basic data
    const initialRecord = await prisma.$transaction(async (prisma) => {
      // Create the main record
      const record = await prisma.teganganListrik.create({
        data: {
          tower: {
            connect: { id: parseInt(towerId) }
          },
          user: {
            connect: { id: userId }
          },
          status: 'PENDING', // Initial status
          kategori: kategori,
          nilaiInput: parseFloat(nilaiInput),
          nilaiDeteksi: 0, // Default value until ML processing
          satuan: satuan,
          // Default values for ML response fields
        }
      });
      
      // Create photo record with the uploaded image URL
      const photo = await prisma.teganganFoto.create({
        data: {
          url: uploadResult.url,
          teganganListrik: {
            connect: { id: record.id }
          }
        }
      });
      
      // Return the record with photo
      return {
        ...record,
        fotos: [photo]
      };
    }, {
      timeout: 15000 
    });
    
    // Include tower and user data in the response
    const completeRecord = await prisma.teganganListrik.findUnique({
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
 * Process the Tegangan Listrik record in the background
 * @param {Number} recordId The ID of the initial record
 * @param {Object} data Form data
 * @param {Object} file Uploaded file
 * @param {String} userId Current user ID
 * @returns {Promise<void>}
 */
const processInBackground = async (recordId, data, file, userId) => {
  try {
    const { kategori, nilaiInput } = data;
    
    console.log(`Starting background processing for record ID ${recordId}`);
    
    // Update status to IN_PROGRESS
    await prisma.teganganListrik.update({
      where: { id: recordId },
      data: { status: 'IN_PROGRESS' }
    });
    
    try {
      // Execute ML API call
      console.log('Starting ML API call...');
      const mlResponse = await mlApiService.analyzeTeganganListrik(file.buffer);
      
      console.log('ML Response for TeganganListrik:', JSON.stringify(mlResponse));
      
      // Extract the detected voltage value from the ML response
      let nilaiDeteksi = NaN;
      
      if (mlResponse && 
          mlResponse.processed_data && 
          Array.isArray(mlResponse.processed_data) && 
          mlResponse.processed_data.length > 0 && 
          mlResponse.processed_data[0].Tegangan) {
          
        nilaiDeteksi = parseFloat(mlResponse.processed_data[0].Tegangan);
        console.log('Extracted nilaiDeteksi:', nilaiDeteksi);
      } else {
        console.log('Could not extract nilaiDeteksi from response:', mlResponse);
      }
      
      // Determine status by comparing input value with detected value
      let validationStatus = 'INVALID';
      
      if (!isNaN(nilaiDeteksi)) {
        // Allow a small tolerance (e.g., 5% difference)
        const tolerance = 0.05; // 5% tolerance
        const inputValue = parseFloat(nilaiInput);
        const difference = Math.abs(inputValue - nilaiDeteksi);
        
        // Handle division by zero for zero input value
        const percentDifference = inputValue === 0 
          ? (nilaiDeteksi === 0 ? 0 : 1) // If input is 0, only valid if detection is also 0
          : difference / inputValue;
        
        validationStatus = percentDifference <= tolerance ? 'VALID' : 'INVALID';
        console.log(`Comparison: Input ${inputValue}, Detected ${nilaiDeteksi}, Diff ${difference}, PercentDiff ${percentDifference}, Status ${validationStatus}`);
      }
      
      // Determine profile (LOW/NORMAL/HIGH) based on DETECTED value
      const valueForProfil = !isNaN(nilaiDeteksi) ? nilaiDeteksi : parseFloat(nilaiInput);
      const profil = determineTeganganProfil(kategori, valueForProfil);
      
      console.log(`Determined profil for ${kategori} with detected value ${valueForProfil}: ${profil}`);
      
      // Update the record with ML results and set status to COMPLETED
      await prisma.teganganListrik.update({
        where: { id: recordId },
        data: {
          status: 'COMPLETED',
          nilaiDeteksi: isNaN(nilaiDeteksi) ? 0 : nilaiDeteksi,
          validationStatus: validationStatus,
          profil: profil
        }
      });
      
      // Log the successful completion
      console.log(`Background processing completed successfully for record ID ${recordId}`);
    } catch (mlError) {
      console.error('ML or image processing error:', mlError);
      
      // Update status to ERROR
      await prisma.teganganListrik.update({
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
      await prisma.teganganListrik.update({
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
 * Determine the TeganganProfil (LOW/NORMAL/HIGH) based on category and value
 * @param {string} kategori - The voltage category (RN, TN, SN, RT, ST, RS, GN, N, R, S, T)
 * @param {number} nilai - The measured value
 * @returns {string} - The profile (LOW, NORMAL, HIGH)
 */
const determineTeganganProfil = (kategori, nilai) => {
  // Default values
  let profil = 'NORMAL';
  
  // Parse the value to ensure it's a number
  const value = parseFloat(nilai);
  
  // Check if it's a phase-to-neutral voltage (RN, TN, SN)
  if (['RN', 'TN', 'SN'].includes(kategori)) {
    if (value < 200) {
      profil = 'LOW';
    } else if (value >= 200 && value <= 240) {
      profil = 'NORMAL';
    } else { // value > 240
      profil = 'HIGH';
    }
  }
  // Check if it's a phase-to-phase voltage (RT, ST, RS)
  else if (['RT', 'ST', 'RS'].includes(kategori)) {
    if (value < 380) {
      profil = 'LOW';
    } else if (value >= 380 && value <= 415) {
      profil = 'NORMAL';
    } else { // value > 415
      profil = 'HIGH';
    }
  }
  // Check if it's a ground-to-neutral voltage (GN)
  else if (kategori === 'GN') {
    // For GN, any value should be close to 0
    // Let's say normal is ≤1V, high is >1V
    if (value <= 1) {
      profil = 'NORMAL';
    } else {
      profil = 'HIGH';
    }
  }
  // Check if it's a current measurement (N, R, S, T)
  else if (['N', 'R', 'S', 'T'].includes(kategori)) {
    if (value < 10) {
      profil = 'LOW';
    } else if (value >= 10 && value <= 60) {
      profil = 'NORMAL';
    } else { // value > 60
      profil = 'HIGH';
    }
  }
  
  return profil;
};

/**
 * Determine the appropriate unit (V or A) based on category
 * @param {string} kategori - The voltage category
 * @returns {string} - The unit (V or A)
 */
const determineSatuan = (kategori) => {
  // Single-letter categories (N, R, S, T) are for current (Ampere)
  if (['N', 'R', 'S', 'T'].includes(kategori)) {
    return 'A';
  }
  // All others are for voltage (Volt)
  return 'V';
};

/**
 * Get all Tegangan Listrik records
 * @param {Object} query Query parameters
 * @returns {Promise<Array<Object>>} List of Tegangan Listrik records
 */
const getAllTeganganListrik = async (query) => {
  try {
    const { towerId, kategori, validationStatus, profil, page = 1, limit = 10, status } = query;
    const skip = (page - 1) * parseInt(limit);
    
    const whereClause = {};
    
    if (towerId) {
      whereClause.towerId = parseInt(towerId);
    }
    
    if (kategori) {
      whereClause.kategori = kategori;
    }
    
    if (validationStatus) {
      whereClause.validationStatus = validationStatus;
    }
    
    if (profil) {
      whereClause.profil = profil;
    }
    
    // Filter by status if provided
    if (status) {
      whereClause.status = status;
    } else {
      // By default, only show COMPLETED records
      whereClause.status = 'COMPLETED';
    }
    
    const [data, total] = await Promise.all([
      prisma.teganganListrik.findMany({
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
      prisma.teganganListrik.count({ where: whereClause })
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
    console.error('Error in getAllTeganganListrik:', error);
    throw error;
  }
};

/**
 * Get a Tegangan Listrik record by ID
 * @param {Number} id Tegangan Listrik ID
 * @returns {Promise<Object>} Tegangan Listrik record
 */
const getTeganganListrikById = async (id) => {
  try {
    const record = await prisma.teganganListrik.findUnique({
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
        fotos, // Keep photos but hide detailed processing results
        message: `Data is currently being processed (status: ${record.status})`
      };
    }
    
    return record;
  } catch (error) {
    console.error('Error in getTeganganListrikById:', error);
    throw error;
  }
};

module.exports = {
  createInitialRecord,
  processInBackground,
  getAllTeganganListrik,
  getTeganganListrikById,
  determineTeganganProfil, // Export for testing
  determineSatuan // Export for testing
};