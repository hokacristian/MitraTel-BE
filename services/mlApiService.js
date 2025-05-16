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
    
    // Add all photos to form data
    photoBuffers.forEach((buffer, index) => {
      formData.append('photos', buffer, `photo${index}.jpg`);
    });
    
    const response = await axios.post(`${ML_API_BASE_URL}/analyze-kebersihan`, formData, {
      headers: {
        ...formData.getHeaders(),
      }
    });
    
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
    
    // Add all photos to form data
    photoBuffers.forEach((buffer, index) => {
      formData.append('photos', buffer, `photo${index}.jpg`);
    });
    
    const response = await axios.post(`${ML_API_BASE_URL}/analyze-antenna`, formData, {
      headers: {
        ...formData.getHeaders(),
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error calling ML API for antenna analysis:', error);
    throw new Error('Failed to analyze antenna devices');
  }
};

module.exports = {
  analyzeKebersihanSite,
  analyzePerangkatAntenna
};