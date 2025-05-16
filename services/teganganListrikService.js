// Updated teganganListrikService.js to handle the correct ML API response format

const prisma = require('../configs/prisma');
const imageKitService = require('./imageKitService');
const mlApiService = require('./mlApiService');

/**
 * Create a new Tegangan Listrik record with photo
 * @param {Object} data Form data
 * @param {Number} data.towerId Tower ID
 * @param {TeganganKategori} data.kategori Voltage category
 * @param {Number} data.nilaiInput Input voltage value
 * @param {Object} file Uploaded file
 * @param {String} userId Current user ID
 * @returns {Promise<Object>} Created Tegangan Listrik
 */
const createTeganganListrik = async (data, file, userId) => {
  const { towerId, kategori, nilaiInput } = data;
  
  try {
    // 1. Verify that the tower exists first
    const tower = await prisma.tower.findUnique({
      where: { id: parseInt(towerId) }
    });

    if (!tower) {
      throw new Error(`Tower with ID ${towerId} not found`);
    }

    // 2. Process ML API call and ImageKit upload in parallel outside of transaction
    const [mlResponse, uploadResult] = await Promise.all([
      // ML API call
      mlApiService.analyzeTeganganListrik(file.buffer).catch(error => {
        console.error('ML API error:', error);
        return { processed_data: [{ Tegangan: 'NaN' }] }; // Default response format matching the API
      }),
      
      // ImageKit upload
      imageKitService.uploadImage(file.buffer, file.originalname)
    ]);

    console.log('ML Response received:', JSON.stringify(mlResponse));

    // 3. Extract the detected voltage value from the ML response
    // Based on the screenshot, the format is { processed_data: [{ Tegangan: 40.5 }] }
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
    
    // 4. Determine status by comparing input value with detected value
    let status = 'INVALID';
    
    if (!isNaN(nilaiDeteksi)) {
      // Allow a small tolerance (e.g., 5% difference)
      const tolerance = 0.00; // 5% tolerance
      const inputValue = parseFloat(nilaiInput);
      const difference = Math.abs(inputValue - nilaiDeteksi);
      
      // Handle division by zero for zero input value
      const percentDifference = inputValue === 0 
        ? (nilaiDeteksi === 0 ? 0 : 1) // If input is 0, only valid if detection is also 0
        : difference / inputValue;
      
      status = percentDifference <= tolerance ? 'VALID' : 'INVALID';
      console.log(`Comparison: Input ${inputValue}, Detected ${nilaiDeteksi}, Diff ${difference}, PercentDiff ${percentDifference}, Status ${status}`);
    }
    
    // 5. Now run database operations in a transaction with a higher timeout
    // Only the critical database operations are inside the transaction
    return await prisma.$transaction(async (prisma) => {
      // Create Tegangan Listrik record
      const teganganListrik = await prisma.teganganListrik.create({
        data: {
          nilaiInput: parseFloat(nilaiInput),
          nilaiDeteksi: isNaN(nilaiDeteksi) ? 0 : nilaiDeteksi, // Store 0 if NaN
          kategori: kategori,
          status: status,
          user: {
            connect: { id: userId }
          },
          tower: {
            connect: { id: parseInt(towerId) }
          }
        }
      });
      
      // Create photo record with the pre-uploaded image URL
      await prisma.teganganFoto.create({
        data: {
          url: uploadResult.url,
          teganganId: teganganListrik.id
        }
      });
      
      // Return created record with photos
      return prisma.teganganListrik.findUnique({
        where: { id: teganganListrik.id },
        include: {
          fotos: true,
          tower: true,
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
    console.error('Error in createTeganganListrik:', error);
    throw error;
  }
};

/**
 * Get all Tegangan Listrik records
 * @param {Object} query Query parameters
 * @returns {Promise<Array<Object>>} List of Tegangan Listrik records
 */
const getAllTeganganListrik = async (query) => {
  try {
    const { towerId, kategori, status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * parseInt(limit);
    
    const whereClause = {};
    
    if (towerId) {
      whereClause.towerId = parseInt(towerId);
    }
    
    if (kategori) {
      whereClause.kategori = kategori;
    }
    
    if (status) {
      whereClause.status = status;
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
    return prisma.teganganListrik.findUnique({
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
    console.error('Error in getTeganganListrikById:', error);
    throw error;
  }
};

module.exports = {
  createTeganganListrik,
  getAllTeganganListrik,
  getTeganganListrikById
};