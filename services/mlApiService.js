// Updated mlApiService.js with correct endpoint and response format for PerangkatAntenna

const axios = require('axios');
const FormData = require('form-data');

const ML_API_BASE_URL = process.env.ML_API_BASE_URL || 'https://your-ml-api-url.com';

/**
 * Send photos to ML API for Kebersihan Site analysis
 * @param {Array<Buffer>} photoBuffers Array of photo buffers
 * @returns {Promise<Object>} ML API response
 */
const analyzeKebersihanSite = async (photoBuffers) => {
  try {
    const formData = new FormData();
    
    // Add all photos to form data - based on the screenshot, the param name is 'image'
    photoBuffers.forEach((buffer, index) => {
      formData.append('image', buffer, `photo${index}.jpg`);
    });
    
    console.log('Sending request to kebersihan API endpoint');
    
    // Using the correct endpoint from the screenshot
    const response = await axios.post(`${ML_API_BASE_URL}/predict_kebersihan`, formData, {
      headers: {
        ...formData.getHeaders(),
      }
    });
    
    console.log('Kebersihan ML API Response:', JSON.stringify(response.data));
    
    return response.data;
  } catch (error) {
    console.error('Error calling ML API for kebersihan analysis:', error);
    throw new Error('Failed to analyze site cleanliness');
  }
};

/**
 * Send photos to ML API for Perangkat Antenna analysis
 * @param {Array<Buffer>} photoBuffers Array of photo buffers
 * @returns {Promise<Object>} ML API response
 */
const analyzePerangkatAntenna = async (photoBuffers) => {
  try {
    const formData = new FormData();
    
    // Based on the screenshot, the parameter name is 'file'
    photoBuffers.forEach((buffer, index) => {
      formData.append('file', buffer, `photo${index}.jpg`);
    });
    
    console.log('Sending request to antenna API endpoint');
    
    // Using the correct endpoint from the screenshot
    const response = await axios.post(`${ML_API_BASE_URL}/detect_antenna_and_height`, formData, {
      headers: {
        ...formData.getHeaders(),
      }
    });
    
    console.log('Perangkat Antenna ML API Response:', JSON.stringify(response.data));
    
    return response.data;
  } catch (error) {
    console.error('Error calling ML API for antenna analysis:', error);
    throw new Error('Failed to analyze antenna devices');
  }
};

/**
 * Send photo to ML API for Tegangan Listrik analysis
 * @param {Buffer} photoBuffer Photo buffer
 * @returns {Promise<Object>} ML API response
 */
const analyzeTeganganListrik = async (photoBuffer) => {
  try {
    const formData = new FormData();
    
    // Add photo to form data
    formData.append('file', photoBuffer, 'voltage.jpg');
    
    // Using the correct endpoint from your screenshots
    const response = await axios.post(`${ML_API_BASE_URL}/process_lcd_image_direct_openai`, formData, {
      headers: {
        ...formData.getHeaders(),
      }
    });
    
    console.log('Tegangan ML API Response:', JSON.stringify(response.data));
    
    // Return the processed data in a consistent format
    return response.data;
  } catch (error) {
    console.error('Error calling ML API for tegangan analysis:', error);
    throw new Error('Failed to analyze tegangan listrik');
  }
};

module.exports = {
  analyzeKebersihanSite,
  analyzePerangkatAntenna,
  analyzeTeganganListrik
};