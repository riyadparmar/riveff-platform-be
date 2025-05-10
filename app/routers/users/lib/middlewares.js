const jwt = require('jsonwebtoken');
const User = require('../../../../models/lib/UserSchema');

// Secret key for JWT - should be in env variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: true,
        message: 'No authentication token, access denied'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user by ID and check if exists
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        error: true,
        message: 'User not found'
      });
    }

    // Check if account is active
    if (user.accountStatus !== 'active') {
      return res.status(403).json({
        error: true,
        message: `Your account is ${user.accountStatus}. Please contact support.`
      });
    }

    // Set user data in request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: true,
        message: 'Invalid token'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: true, 
        message: 'Token expired'
      });
    }
    
    res.status(500).json({
      error: true,
      message: 'Server error during authentication',
      details: error.message
    });
  }
};

module.exports = auth;