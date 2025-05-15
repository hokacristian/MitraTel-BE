const prisma = require('../configs/prisma');

const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  
  if (!user) return null;
  
  // Remove password before returning
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const updateProfile = async (userId, userData) => {
  // Extract only allowed fields to update
  const { name, nomorTelpon } = userData;
  
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name && { name }),
      ...(nomorTelpon && { nomorTelpon })
    }
  });
  
  // Remove password before returning
  const { password, ...userWithoutPassword } = updatedUser;
  return userWithoutPassword;
};

module.exports = {
  getProfile,
  updateProfile
};