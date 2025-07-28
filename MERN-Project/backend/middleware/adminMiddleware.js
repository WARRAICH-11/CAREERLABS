const User = require('../models/User');
const Role = require('../models/Role');
const asyncHandler = require('express-async-handler');

/**
 * Middleware to check if the user has admin access
 * This middleware should be used after the protect middleware
 */
const admin = asyncHandler(async (req, res, next) => {
  // Check if user exists and has admin role
  const user = await User.findById(req.user._id).populate('role');
  
  if (!user) {
    res.status(401);
    throw new Error('User not found');
  }
  
  // Check if user has admin dashboard access
  if (!user.role || !user.role.permissions || !user.role.permissions.admin || !user.role.permissions.admin.accessDashboard) {
    res.status(403);
    throw new Error('Access denied. Admin privileges required');
  }
  
  // User has admin access, continue
  next();
});

/**
 * Factory function to create middleware that checks for specific permissions
 * @param {string} module - The module to check permissions for (users, jobs, etc.)
 * @param {string} action - The specific action (read, create, update, delete, etc.)
 * @returns {Function} Middleware function to check specific permission
 */
const permit = (module, action) => {
  return asyncHandler(async (req, res, next) => {
    // Check if user exists and has the required permission
    const user = await User.findById(req.user._id).populate('role');
    
    if (!user) {
      res.status(401);
      throw new Error('User not found');
    }
    
    // Check if user has the specific permission
    if (!user.role || !user.role.hasPermission(module, action)) {
      res.status(403);
      throw new Error(`Access denied. You don't have permission to ${action} ${module}`);
    }
    
    // User has the required permission, continue
    next();
  });
};

module.exports = { admin, permit }; 