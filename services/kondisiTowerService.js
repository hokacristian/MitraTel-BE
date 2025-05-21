// Updated kondisiTowerService.js with revised field names and pose detection

const prisma = require('../configs/prisma');
const imageKitService = require('./imageKitService');
const mlApiService = require('./mlApiService');

/**
 * Create initial KondisiTower record with PENDING status including photo URLs
 * @param {Object} data Form data
 * @param {Object} rustFile Rust photo file
 * @param {Object} boltsFile Bolts photo file
 * @param {Object} poseFile Pose photo file (optional)
 * @param {String} userId Current user ID
 * @returns {Promise<Object>} Created initial KondisiTower record with photo URLs
 */
const createInitialRecord = async (data, rustFile, boltsFile, poseFile, userId) => {
  console.log('=== createInitialRecord called ===');
  console.log('towerId:', data.towerId);
  console.log('Files present:', {
    rustFile: !!rustFile,
    boltsFile: !!boltsFile,
    poseFile: !!poseFile
  });
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
    
    const uploadPromises = [];
    
    if (rustFile) {
      uploadPromises.push(imageKitService.uploadImage(rustFile.buffer, rustFile.originalname));
    }
    
    if (boltsFile) {
      uploadPromises.push(imageKitService.uploadImage(boltsFile.buffer, boltsFile.originalname));
    }

    if (poseFile) {
      uploadPromises.push(imageKitService.uploadImage(poseFile.buffer, poseFile.originalname));
    }
    
    // Wait for all uploads to complete
    const uploadResults = await Promise.all(uploadPromises);
    console.log(`Successfully uploaded ${uploadResults.length} photos to ImageKit`);

    // Create the initial record with PENDING status and basic data
    const initialRecord = await prisma.$transaction(async (prisma) => {
      // Create the main record
      const record = await prisma.kondisiTower.create({
        data: {
          tower: {
            connect: { id: parseInt(towerId) }
          },
          user: {
            connect: { id: userId }
          },
          status: 'PENDING' // Initial status
          // Default values are already set in the schema for these fields
        }
      });
      
      // Create photo records with the uploaded image URLs
      const photoRecords = [];
      let index = 0;
      
      if (rustFile) {
        const photo = await prisma.kondisiFoto.create({
          data: {
            url: uploadResults[index].url,
            type: 'rust',
            kondisiTower: {
              connect: { id: record.id }
            }
          }
        });
        photoRecords.push(photo);
        index++;
      }
      
      if (boltsFile) {
        const photo = await prisma.kondisiFoto.create({
          data: {
            url: uploadResults[index].url,
            type: 'bolts',
            kondisiTower: {
              connect: { id: record.id }
            }
          }
        });
        photoRecords.push(photo);
        index++;
      }

      if (poseFile) {
        const photo = await prisma.kondisiFoto.create({
          data: {
            url: uploadResults[index].url,
            type: 'pose',
            kondisiTower: {
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
    const completeRecord = await prisma.kondisiTower.findUnique({
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
 * Process the KondisiTower record in the background
 * @param {Number} recordId The ID of the initial record
 * @param {Object} data Form data
 * @param {Object} rustFile Rust photo file
 * @param {Object} boltsFile Bolts photo file
 * @param {Object} poseFile Pose photo file (optional)
 * @param {String} userId Current user ID
 * @returns {Promise<void>}
 */
const processInBackground = async (recordId, data, rustFile, boltsFile, poseFile, userId) => {
  try {
    console.log(`Starting background processing for record ID ${recordId}`);
    
    // Update status to IN_PROGRESS
    await prisma.kondisiTower.update({
      where: { id: recordId },
      data: { status: 'IN_PROGRESS' }
    });
    
    let rustResponse = null;
    let boltsResponse = null;
    let poseResponse = null;
    
    try {
      // Process rust detection if file exists
      if (rustFile) {
        console.log('Starting Rust ML API call...');
        try {
          rustResponse = await mlApiService.analyzeRust(rustFile.buffer);
          console.log('Rust ML Response:', JSON.stringify(rustResponse));
        } catch (rustError) {
          console.error('Error in rust detection:', rustError.message);
          if (rustError.response) {
            console.error('Rust API error details:', {
              status: rustError.response.status,
              data: rustError.response.data
            });
          }
        }
      }
      
      // Process bolts detection if file exists
      if (boltsFile) {
        console.log('Starting Bolts ML API call...');
        try {
          boltsResponse = await mlApiService.analyzeBolts(boltsFile.buffer);
          console.log('Bolts ML Response:', JSON.stringify(boltsResponse));
        } catch (boltsError) {
          console.error('Error in bolts detection:', boltsError.message);
          if (boltsError.response) {
            console.error('Bolts API error details:', {
              status: boltsError.response.status,
              data: boltsError.response.data
            });
          }
        }
      }

      // Process pose detection if file exists
      if (poseFile) {
        console.log('Starting Pose ML API call...');
        try {
          poseResponse = await mlApiService.analyzePose(poseFile.buffer);
          console.log('Pose ML Response:', JSON.stringify(poseResponse));
        } catch (poseError) {
          console.error('Error in pose detection:', poseError.message);
          if (poseError.response) {
            console.error('Pose API error details:', {
              status: poseError.response.status,
              data: poseError.response.data
            });
          }
        }
      }
      
      // Extract values from ML responses
      let lvlBaut = null;
      let jmlhBaut = 0;
      let levelKarat = null;
      // let deskripsiKarat = null;
      let poseTower = null;
      
      // Process bolts detection response
      if (boltsResponse) {
        if (boltsResponse.bolt_completeness_status) {
          lvlBaut = boltsResponse.bolt_completeness_status;
        }
        
        if (typeof boltsResponse.total_bolts_detected === 'number') {
          jmlhBaut = boltsResponse.total_bolts_detected;
        }
      }
      
      // Process rust detection response with the new format
      if (rustResponse) {
        if (rustResponse.overall_rust_level) {
          levelKarat = rustResponse.overall_rust_level;
        }
        
        // if (rustResponse.Response) {
        //   deskripsiKarat = rustResponse.Response;
        // }
      }

      // Process pose detection response
if (poseResponse) {
  // Handle array response structure
  if (Array.isArray(poseResponse)) {
    const firstPoseResult = poseResponse[0];
    if (firstPoseResult?.pose_analysis?.pose) {
      poseTower = firstPoseResult.pose_analysis.pose;
    }
  }
  // Handle jika format response berubah ke object langsung
  else if (poseResponse.pose_analysis?.pose) { 
    poseTower = poseResponse.pose_analysis.pose;
  }
}
      
      // Update the record with ML results and set status to COMPLETED
      await prisma.kondisiTower.update({
        where: { id: recordId },
        data: {
          status: 'COMPLETED',
          lvlBaut,
          jmlhBaut,
          levelKarat,
          // deskripsiKarat,
          poseTower
        }
      });
      
      // Log the successful completion
      console.log(`Background processing completed successfully for record ID ${recordId}`);
    } catch (mlError) {
  console.error('ML or image processing error:', mlError);
  console.error('Error details:', mlError.response ? mlError.response.data : 'No response data');
  console.error('Error status:', mlError.response ? mlError.response.status : 'No status');
  
  // Update status to ERROR with error message
  await prisma.kondisiTower.update({
    where: { id: recordId },
    data: { 
      status: 'ERROR',
      errorMessage: mlError.message || 'Unknown error occurred'
    }
  });
  
  throw mlError;
}
  } catch (error) {
    console.error(`Background processing failed for record ID ${recordId}:`, error);
    
    // Make sure the status is set to ERROR
    try {
      await prisma.kondisiTower.update({
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
 * Get all KondisiTower records
 * @param {Object} query Query parameters
 * @returns {Promise<Object>} Paginated KondisiTower records
 */
const getAllKondisiTowers = async (query) => {
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
      prisma.kondisiTower.findMany({
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
      prisma.kondisiTower.count({ where: whereClause })
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
    console.error('Error in getAllKondisiTowers:', error);
    throw error;
  }
};

/**
 * Get a KondisiTower record by ID
 * @param {Number} id KondisiTower ID
 * @returns {Promise<Object>} KondisiTower record
 */
const getKondisiTowerById = async (id) => {
  try {
    const record = await prisma.kondisiTower.findUnique({
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
    console.error('Error in getKondisiTowerById:', error);
    throw error;
  }
};

module.exports = {
  createInitialRecord,
  processInBackground,
  getAllKondisiTowers,
  getKondisiTowerById
};