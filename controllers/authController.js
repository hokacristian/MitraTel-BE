const { registerUser, findUserByUsernameOrPhone, findUserByUsername } = require('../services/authService');
const { generateToken } = require('../configs/jwt');
const bcrypt = require('bcryptjs');

const register = async (req, res) => {
  const { username, name, nomorTelpon, password, role } = req.body;
  
  // Validate required fields
  if (!username || !name || !nomorTelpon || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if username or phone already exists
    const userExists = await findUserByUsernameOrPhone(username, nomorTelpon);
    if (userExists) {
      let message = 'Username already exists';
      if (userExists.nomorTelpon === nomorTelpon) message = 'Phone number already exists';
      return res.status(400).json({ message });
    }

    // Register with default PETUGAS role if not specified
    const finalRole = role || 'PETUGAS';
    const user = await registerUser(username, name, nomorTelpon, password, finalRole);
    
    res.status(201).json({
      message: 'User registered successfully',
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = generateToken({ id: user.id, role: user.role });
    
    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(200).json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

module.exports = {
  register,
  login
};