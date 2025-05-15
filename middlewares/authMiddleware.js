const { verifyToken } = require('../configs/jwt');

// Authentication middleware - verifies token and extracts user data
const authMiddleware = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    // Verify token and extract payload
    const decoded = verifyToken(token);
    
    // Add user info to request object
    req.user = {
      id: decoded.id,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

// Role-based authorization middleware
const roleMiddleware = (roles) => {
  return (req, res, next) => {
    // Convert single role to array for easier checking
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access forbidden: Insufficient permissions' 
      });
    }
    
    next();
  };
};

module.exports = { 
  authMiddleware,
  roleMiddleware
};