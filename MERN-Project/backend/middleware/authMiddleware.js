const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Mentor = require('../models/Mentor');

// Protect routes - middleware to verify JWT token
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from authorization header, cookies, or query string
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Get token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // Get token from cookie
    token = req.cookies.token;
  } else if (req.query.token) {
    // Get token from URL query parameter (use only for specific cases)
    token = req.query.token;
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this resource'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-default-jwt-secret-key-for-development'
    );

    // Add user to request object
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this resource'
    });
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this resource`
      });
    }
    next();
  };
};

// Check if user is a mentor
const mentorOnly = asyncHandler(async (req, res, next) => {
  // Find mentor profile by user ID
  const mentor = await Mentor.findOne({ user: req.user._id });
  
  if (!mentor) {
    res.status(403);
    throw new Error('Access denied. Mentor privileges required');
  }
  
  // Add mentor to request object for future use
  req.mentor = mentor;
  next();
});

module.exports = {
  protect: exports.protect,
  authorize: exports.authorize,
  mentorOnly
}; 