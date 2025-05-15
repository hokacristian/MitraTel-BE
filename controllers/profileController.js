const { getProfile, updateProfile } = require('../services/profileService');

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const userProfile = await getProfile(userId);
    
    if (!userProfile) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      message: 'Profile fetched successfully',
      user: userProfile
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, nomorTelpon } = req.body;
    
    if (!name && !nomorTelpon) {
      return res.status(400).json({
        message: 'At least one field (name or nomorTelpon) must be provided'
      });
    }
    
    const updatedUser = await updateProfile(userId, { name, nomorTelpon });
    
    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      message: 'Error updating profile',
      error: error.message
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile
};