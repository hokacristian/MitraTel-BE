const ImageKit = require('imagekit');
const fs = require('fs');

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

/**
 * Upload file buffer to ImageKit
 * @param {Buffer} fileBuffer The file buffer
 * @param {String} fileName The file name
 * @returns {Promise<Object>} ImageKit upload response
 */
const uploadImage = async (fileBuffer, fileName) => {
  try {
    const response = await imagekit.upload({
      file: fileBuffer,
      fileName: fileName,
      folder: '/tower-monitoring'
    });
    
    return {
      url: response.url,
      fileId: response.fileId
    };
  } catch (error) {
    console.error('Error uploading to ImageKit:', error);
    throw new Error('Failed to upload image to ImageKit');
  }
};

module.exports = {
  uploadImage
};