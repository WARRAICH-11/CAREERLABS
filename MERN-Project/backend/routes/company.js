const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const Company = require('../models/Company');
const { validateBody } = require('../middleware/validateMiddleware');

// Validation schema for company creation/update
const companySchema = {
  required: ['name'],
  properties: {
    name: { type: 'string', minLength: 1 },
    description: { type: 'string' },
    website: { type: 'string' },
    industry: { type: 'string' },
    size: { 
      type: 'string', 
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001+']
    },
    headquarters: { type: 'string' },
    locations: { 
      type: 'array', 
      items: { type: 'string' } 
    },
    benefits: { 
      type: 'array', 
      items: { type: 'string' } 
    }
  }
};

/**
 * @route   POST /api/companies
 * @desc    Create a new company
 * @access  Private
 */
router.post(
  '/',
  protect,
  validateBody(companySchema),
  asyncHandler(async (req, res) => {
    // Set user as company owner
    req.body.user = req.user.id;
    
    const company = await Company.create(req.body);
    
    res.status(201).json({
      success: true,
      data: company
    });
  })
);

/**
 * @route   GET /api/companies
 * @desc    Get all companies with optional filtering
 * @access  Public
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    // Extract query parameters for filtering
    const { 
      name, industry, size, location, verified, limit = 10, page = 1 
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (industry) filter.industry = { $regex: industry, $options: 'i' };
    if (size) filter.size = size;
    if (location) filter.locations = { $in: [location] };
    if (verified) filter.isVerified = verified === 'true';
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const companies = await Company.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await Company.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: companies.length,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: companies
    });
  })
);

/**
 * @route   GET /api/companies/:id
 * @desc    Get company by ID
 * @access  Public
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const company = await Company.findById(req.params.id).populate({
      path: 'jobs',
      match: { isActive: true },
      options: { sort: { createdAt: -1 } }
    });
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: company
    });
  })
);

/**
 * @route   PUT /api/companies/:id
 * @desc    Update company by ID
 * @access  Private (Company owner only)
 */
router.put(
  '/:id',
  protect,
  validateBody(companySchema),
  asyncHandler(async (req, res) => {
    let company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    // Check ownership
    if (company.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this company'
      });
    }
    
    // Update company
    company = await Company.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: company
    });
  })
);

/**
 * @route   DELETE /api/companies/:id
 * @desc    Delete company by ID
 * @access  Private (Company owner or admin only)
 */
router.delete(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    // Check ownership
    if (company.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this company'
      });
    }
    
    await company.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  })
);

/**
 * @route   GET /api/companies/user/me
 * @desc    Get companies created by the logged in user
 * @access  Private
 */
router.get(
  '/user/me',
  protect,
  asyncHandler(async (req, res) => {
    const companies = await Company.find({ user: req.user.id });
    
    res.status(200).json({
      success: true,
      count: companies.length,
      data: companies
    });
  })
);

/**
 * @route   PUT /api/companies/:id/verify
 * @desc    Verify a company (admin only)
 * @access  Private (Admin only)
 */
router.put(
  '/:id/verify',
  protect,
  asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can verify companies'
      });
    }
    
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { isVerified: true, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: company
    });
  })
);

module.exports = router; 