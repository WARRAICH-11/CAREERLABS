const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { validateBody } = require('../middleware/validateMiddleware');

// Validation schemas
const registerSchema = {
  required: ['name', 'email', 'password'],
  properties: {
    name: { type: 'string' },
    email: { type: 'string' },
    password: { type: 'string' }
  }
};

const loginSchema = {
  required: ['email', 'password'],
  properties: {
    email: { type: 'string' },
    password: { type: 'string' }
  }
};

const resetPasswordSchema = {
  required: ['password'],
  properties: {
    password: { type: 'string' }
  }
};

const forgotPasswordSchema = {
  required: ['email'],
  properties: {
    email: { type: 'string' }
  }
};

// Helper function to send token response with cookie
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  // Cookie options
  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token
    });
};

// @route   POST /api/auth/register
// @desc    Register a user
// @access  Public
router.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password
    });

    // Send token response
    sendTokenResponse(user, 201, res);
  })
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Send token response
    sendTokenResponse(user, 200, res);
  })
);

// @route   GET /api/auth/logout
// @desc    Logout user / clear cookie
// @access  Private
router.get(
  '/logout',
  protect,
  asyncHandler(async (req, res) => {
    // Clear cookie
    res.clearCookie('token');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  })
);

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  })
);

// @route   POST /api/auth/forgotpassword
// @desc    Forgot password
// @access  Public
router.post(
  '/forgotpassword',
  validateBody(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email'
      });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    // Save the updated user with reset token fields
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/auth/resetpassword/${resetToken}`;

    // In a production app, you would send an email with the reset link
    // For this example, we'll just return the reset URL in the response
    res.status(200).json({
      success: true,
      message: 'Password reset token generated',
      resetUrl,
      token: resetToken // In production, you wouldn't include this in the response
    });
  })
);

// @route   PUT /api/auth/resetpassword/:resettoken
// @desc    Reset password
// @access  Public
router.put(
  '/resetpassword/:resettoken',
  validateBody(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    // Find user by reset token and check if token is expired
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Set new password
    user.password = req.body.password;
    
    // Clear reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    // Save user with new password
    await user.save();

    // Send token response
    sendTokenResponse(user, 200, res);
  })
);

// @route   PUT /api/auth/updatepassword
// @desc    Update password for logged in user
// @access  Private
router.put(
  '/updatepassword',
  protect,
  asyncHandler(async (req, res) => {
    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Set new password
    user.password = req.body.newPassword;
    await user.save();

    // Send token response
    sendTokenResponse(user, 200, res);
  })
);

module.exports = router; 