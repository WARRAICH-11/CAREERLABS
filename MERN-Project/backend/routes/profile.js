const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { validateBody } = require('../middleware/validateMiddleware');

// Validation schemas
const profileUpdateSchema = {
  properties: {
    name: { type: 'string' },
    bio: { type: 'string' },
    phone: { type: 'string' },
    location: { type: 'string' },
    skills: { type: 'array' },
    interests: { type: 'array' },
    social: { type: 'object' }
  }
};

const educationSchema = {
  required: ['institution'],
  properties: {
    institution: { type: 'string' },
    degree: { type: 'string' },
    fieldOfStudy: { type: 'string' },
    from: { type: 'string' }, // Will be converted to Date
    to: { type: 'string' },   // Will be converted to Date
    current: { type: 'boolean' },
    description: { type: 'string' }
  }
};

const experienceSchema = {
  required: ['title', 'company'],
  properties: {
    title: { type: 'string' },
    company: { type: 'string' },
    location: { type: 'string' },
    from: { type: 'string' }, // Will be converted to Date
    to: { type: 'string' },   // Will be converted to Date
    current: { type: 'boolean' },
    description: { type: 'string' }
  }
};

// @route   GET /api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  })
);

// @route   PUT /api/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/',
  protect,
  validateBody(profileUpdateSchema),
  asyncHandler(async (req, res) => {
    const {
      name,
      bio,
      phone,
      location,
      skills,
      interests,
      social
    } = req.body;

    // Build profile object
    const profileFields = {};
    
    if (name) profileFields.name = name;
    if (bio) profileFields.bio = bio;
    if (phone) profileFields.phone = phone;
    if (location) profileFields.location = location;
    if (skills) {
      profileFields.skills = Array.isArray(skills) 
        ? skills 
        : skills.split(',').map(skill => skill.trim());
    }
    if (interests) {
      profileFields.interests = Array.isArray(interests) 
        ? interests 
        : interests.split(',').map(interest => interest.trim());
    }
    if (social) profileFields.social = social;

    // Update user profile
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: profileFields },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  })
);

// @route   POST /api/profile/education
// @desc    Add education to profile
// @access  Private
router.post(
  '/education',
  protect,
  validateBody(educationSchema),
  asyncHandler(async (req, res) => {
    const {
      institution,
      degree,
      fieldOfStudy,
      from,
      to,
      current,
      description
    } = req.body;

    const newEdu = {
      institution,
      degree,
      fieldOfStudy,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      current,
      description
    };

    // Add to education array
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $push: { education: newEdu } },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  })
);

// @route   DELETE /api/profile/education/:edu_id
// @desc    Delete education from profile
// @access  Private
router.delete(
  '/education/:edu_id',
  protect,
  asyncHandler(async (req, res) => {
    // Remove education
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { education: { _id: req.params.edu_id } } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  })
);

// @route   POST /api/profile/experience
// @desc    Add experience to profile
// @access  Private
router.post(
  '/experience',
  protect,
  validateBody(experienceSchema),
  asyncHandler(async (req, res) => {
    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      current,
      description
    };

    // Add to experience array
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $push: { experience: newExp } },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  })
);

// @route   DELETE /api/profile/experience/:exp_id
// @desc    Delete experience from profile
// @access  Private
router.delete(
  '/experience/:exp_id',
  protect,
  asyncHandler(async (req, res) => {
    // Remove experience
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { experience: { _id: req.params.exp_id } } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  })
);

// @route   GET /api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public
router.get(
  '/user/:user_id',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.user_id).select('-password -resetPasswordToken -resetPasswordExpire');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  })
);

// @route   GET /api/profile
// @desc    Get all profiles
// @access  Private/Admin
router.get(
  '/',
  protect,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const users = await User.find().select('-password -resetPasswordToken -resetPasswordExpire');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  })
);

// @route   DELETE /api/profile
// @desc    Delete profile and user
// @access  Private
router.delete(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    // Remove user
    await User.findByIdAndRemove(req.user.id);

    res.status(200).json({
      success: true,
      message: 'User deleted'
    });
  })
);

// @route   PUT /api/profile/role/:user_id
// @desc    Update user role
// @access  Private/Admin
router.put(
  '/role/:user_id',
  protect,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { role } = req.body;

    // Validate role
    if (!role || !['student', 'mentor', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid role (student, mentor, or admin)'
      });
    }

    // Update user role
    const user = await User.findByIdAndUpdate(
      req.params.user_id,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  })
);

module.exports = router; 