// Updated mlApiService.js with correct endpoint and response format

const axios = require("axios");
const FormData = require("form-data");

const ML_API_BASE_URL =
  process.env.ML_API_BASE_URL || "https://your-ml-api-url.com";
const ML_API_BASE_TOWER_KEBERSIHAN = 
  process.env.ML_API_BASE_TOWER_KEBERSIHAN || "";

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
      formData.append("image", buffer, `photo${index}.jpg`);
    });

    console.log("Sending request to kebersihan API endpoint");

    // Using the correct endpoint from the screenshot
    const response = await axios.post(
      `${ML_API_BASE_TOWER_KEBERSIHAN}/predict_kebersihan`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    console.log("Kebersihan ML API Response:", JSON.stringify(response.data));

    return response.data;
  } catch (error) {
    console.error("Error calling ML API for kebersihan analysis:", error);
    throw new Error("Failed to analyze site cleanliness");
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
      formData.append("file", buffer, `photo${index}.jpg`);
    });

    console.log("Sending request to antenna API endpoint");

    // Using the correct endpoint from the screenshot
    const response = await axios.post(
      `${ML_API_BASE_URL}/detect_antenna_and_spatial_data`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    console.log(
      "Perangkat Antenna ML API Response:",
      JSON.stringify(response.data)
    );

    return response.data;
  } catch (error) {
    console.error("Error calling ML API for antenna analysis:", error);
    throw new Error("Failed to analyze antenna devices");
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
    formData.append("file", photoBuffer, "voltage.jpg");

    // Using the correct endpoint from your screenshots
    const response = await axios.post(
      `${ML_API_BASE_URL}/process_lcd_image_direct_openai`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    console.log("Tegangan ML API Response:", JSON.stringify(response.data));

    // Return the processed data in a consistent format
    return response.data;
  } catch (error) {
    console.error("Error calling ML API for tegangan analysis:", error);
    throw new Error("Failed to analyze tegangan listrik");
  }
};

/**
 * Send photo to ML API for Rust detection
 * @param {Buffer} photoBuffer Photo buffer
 * @returns {Promise<Object>} ML API response
 */
const analyzeRust = async (photoBuffer) => {
  try {
    const formData = new FormData();

    // Add photo to form data
    formData.append("file", photoBuffer, "rust.jpg");

    console.log("Sending request to rust detection API endpoint");

    // Add the new endpoint for rust detection
    const response = await axios.post(
      `${ML_API_BASE_URL}/detect_rust`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    console.log("Rust ML API Response:", JSON.stringify(response.data));

    return response.data;
  } catch (error) {
    console.error("Error calling ML API for rust analysis:", error);
    throw new Error("Failed to analyze rust condition");
  }
};

/**
 * Send photo to ML API for Bolts detection
 * @param {Buffer} photoBuffer Photo buffer
 * @returns {Promise<Object>} ML API response
 */
const analyzeBolts = async (photoBuffer) => {
  try {
    const formData = new FormData();

    // Add photo to form data
    formData.append("file", photoBuffer, "bolts.jpg");

    console.log("Sending request to bolts detection API endpoint");

    // Add the new endpoint for bolts detection
    const response = await axios.post(
      `${ML_API_BASE_URL}/detect_bolts`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    console.log("Bolts ML API Response:", JSON.stringify(response.data));

    return response.data;
  } catch (error) {
    console.error("Error calling ML API for bolts analysis:", error);
    throw new Error("Failed to analyze bolts condition");
  }
};

/**
 * Send photo to ML API for Pose detection
 * @param {Buffer} photoBuffer Photo buffer
 * @returns {Promise<Object>} ML API response
 */
// Update the analyzePose function to use the "image" parameter name
const analyzePose = async (photoBuffer) => {
  try {
    const formData = new FormData();

    // CHANGE THIS LINE: Use "image" parameter name instead of "file"
    formData.append("image", photoBuffer, "pose.jpg");

    console.log("Sending request to pose detection API endpoint");

    // Using the correct endpoint
    const response = await axios.post(
      `${ML_API_BASE_TOWER_KEBERSIHAN}/predict_pose`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    console.log("Pose ML API Response:", JSON.stringify(response.data));

    return response.data;
  } catch (error) {
    console.error("Error calling ML API for pose analysis:", error);
    throw new Error("Failed to analyze tower pose");
  }
};

module.exports = {
  analyzeKebersihanSite,
  analyzePerangkatAntenna,
  analyzeTeganganListrik,
  analyzeRust,
  analyzeBolts,
  analyzePose,
};