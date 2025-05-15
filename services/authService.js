const prisma = require('../configs/prisma');
const bcrypt = require('bcryptjs');

const registerUser = async (username, name, nomorTelpon, password, role) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      name,
      nomorTelpon,
      password: hashedPassword,
      role
    },
  });

  // Remove password from returned object
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const findUserByUsernameOrPhone = async (username, nomorTelpon) => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        { nomorTelpon }
      ]
    }
  });
  return user;
};

const findUserByUsername = async (username) => {
  return prisma.user.findUnique({
    where: { username }
  });
};

module.exports = {
  registerUser,
  findUserByUsernameOrPhone,
  findUserByUsername
};