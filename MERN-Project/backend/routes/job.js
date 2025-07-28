const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const { validateBody } = require('../middleware/validateMiddleware');
const Job = require('../models/Job');
const Company = require('../models/Company');
const User = require('../models/User');

// Validation schema for job creation/update
const jobSchema = {
  required: ['title', 'description', 'company'],
  properties: {
    title: { type: 'string', minLength: 1 },
    description: { type: 'string', minLength: 10 },
    shortDescription: { type: 'string' },
    responsibilities: { 
      type: 'array', 
      items: { type: 'string' } 
    },
    requirements: { 
      type: 'array', 
      items: { type: 'string' } 
    },
    preferredQualifications: { 
      type: 'array', 
      items: { type: 'string' } 
    },
    category: { type: 'string' },
    industry: { type: 'string' },
    experienceLevel: { 
      type: 'string',
      enum: ['entry', 'junior', 'mid', 'senior', 'executive']
    },
    educationRequirements: { 
      type: 'array', 
      items: { type: 'string' } 
    },
    skills: { 
      type: 'array',
      items: { type: 'string' }
    },
    salary: {
      type: 'object',
      properties: {
        min: { type: 'number' },
        max: { type: 'number' },
        currency: { type: 'string' },
        isNegotiable: { type: 'boolean' },
        period: { 
          type: 'string',
          enum: ['hourly', 'monthly', 'annual']
        }
      }
    },
    benefits: { 
      type: 'array', 
      items: { type: 'string' } 
    },
    remote: { type: 'boolean' },
    location: {
      type: 'object',
      properties: {
        city: { type: 'string' },
        state: { type: 'string' },
        country: { type: 'string' },
        postalCode: { type: 'string' }
      }
    },
    company: { type: 'string' },
    jobType: { 
      type: 'string',
      enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance']
    },
    applicationQuestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          required: { type: 'boolean' }
        }
      }
    },
    deadline: { type: 'string', format: 'date-time' },
    isActive: { type: 'boolean' }
  }
};

// Application validation schema
const applicationSchema = {
  required: ['resume'],
  properties: {
    resume: { type: 'string' },
    coverLetter: { type: 'string' },
    answers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          answer: { type: 'string' }
        }
      }
    }
  }
};

/**
 * @route   POST /api/jobs
 * @desc    Create a new job
 * @access  Private
 */
router.post(
  '/',
  protect,
  validateBody(jobSchema),
  asyncHandler(async (req, res) => {
    // Check if company exists and user is associated with it
    const company = await Company.findById(req.body.company);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    // Check if user owns the company or is admin
    if (company.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to post jobs for this company'
      });
    }
    
    // Add user ID to job posting
    req.body.postedBy = req.user.id;
    
    // Create the job
    const job = await Job.create(req.body);
    
    res.status(201).json({
      success: true,
      data: job
    });
  })
);

/**
 * @route   GET /api/jobs
 * @desc    Get all jobs with filtering, sorting and pagination
 * @access  Public
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    // Extract query parameters for filtering
    const { 
      title, company, location, remote, jobType, category, industry, 
      experienceLevel, skills, minSalary, maxSalary, featured,
      sort = 'createdAt', order = 'desc', limit = 10, page = 1
    } = req.query;
    
    // Build filter object
    const filter = { isActive: true };
    
    if (title) filter.title = { $regex: title, $options: 'i' };
    if (company) filter.company = company;
    if (location) {
      filter['$or'] = [
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.state': { $regex: location, $options: 'i' } },
        { 'location.country': { $regex: location, $options: 'i' } }
      ];
    }
    if (remote === 'true') filter.remote = true;
    if (jobType) filter.jobType = jobType;
    if (category) filter.category = { $regex: category, $options: 'i' };
    if (industry) filter.industry = { $regex: industry, $options: 'i' };
    if (experienceLevel) filter.experienceLevel = experienceLevel;
    if (skills) {
      const skillsArray = skills.split(',');
      filter.skills = { $in: skillsArray };
    }
    if (minSalary) filter['salary.min'] = { $gte: parseFloat(minSalary) };
    if (maxSalary) filter['salary.max'] = { $lte: parseFloat(maxSalary) };
    if (featured === 'true') filter.featured = true;
    
    // Build sort object
    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const jobs = await Job.find(filter)
      .populate('company', 'name logo isVerified')
      .populate('skills', 'name category')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await Job.countDocuments(filter);
    
    // Add the user saved/applied status if authenticated
    let enhancedJobs = jobs;
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        enhancedJobs = jobs.map(job => {
          const jobObj = job.toObject();
          jobObj.isApplied = job.hasApplied(decoded.id);
          jobObj.isSaved = job.isSavedByUser(decoded.id);
          return jobObj;
        });
      } catch (err) {
        // Failed to enhance with user data, continue with original jobs
      }
    }
    
    res.status(200).json({
      success: true,
      count: jobs.length,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: enhancedJobs
    });
  })
);

/**
 * @route   GET /api/jobs/:id
 * @desc    Get job by ID
 * @access  Public
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id)
      .populate('company', 'name logo website industry size headquarters locations isVerified')
      .populate('skills', 'name category description')
      .populate('postedBy', 'name');
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Increment view count
    job.views += 1;
    await job.save();
    
    // Check if user has saved/applied to this job
    let jobData = job.toObject();
    
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        jobData.isApplied = job.hasApplied(decoded.id);
        jobData.isSaved = job.isSavedByUser(decoded.id);
      } catch (err) {
        // Failed to enhance with user data, continue with original job
      }
    }
    
    res.status(200).json({
      success: true,
      data: jobData
    });
  })
);

/**
 * @route   PUT /api/jobs/:id
 * @desc    Update job by ID
 * @access  Private (Job poster only)
 */
router.put(
  '/:id',
  protect,
  validateBody(jobSchema),
  asyncHandler(async (req, res) => {
    let job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Check ownership or admin
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job'
      });
    }
    
    // Check if company changed and validate ownership
    if (req.body.company && req.body.company !== job.company.toString()) {
      const company = await Company.findById(req.body.company);
      
      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        });
      }
      
      if (company.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to post jobs for this company'
        });
      }
    }
    
    // Update job
    job = await Job.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: job
    });
  })
);

/**
 * @route   DELETE /api/jobs/:id
 * @desc    Delete job by ID
 * @access  Private (Job poster or admin only)
 */
router.delete(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Check ownership
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job'
      });
    }
    
    await job.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  })
);

/**
 * @route   POST /api/jobs/:id/apply
 * @desc    Apply to a job
 * @access  Private
 */
router.post(
  '/:id/apply',
  protect,
  validateBody(applicationSchema),
  asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Check if job is still active
    if (!job.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This job is no longer accepting applications'
      });
    }
    
    // Check if user already applied
    if (job.hasApplied(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this job'
      });
    }
    
    // Add applicant ID to application
    const application = {
      ...req.body,
      applicant: req.user.id
    };
    
    // Add application to job
    job.applications.push(application);
    await job.save();
    
    res.status(201).json({
      success: true,
      data: {
        message: 'Application submitted successfully',
        applicationId: job.applications[job.applications.length - 1]._id
      }
    });
  })
);

/**
 * @route   GET /api/jobs/applications/me
 * @desc    Get all applications by the user
 * @access  Private
 */
router.get(
  '/applications/me',
  protect,
  asyncHandler(async (req, res) => {
    const jobs = await Job.find({
      'applications.applicant': req.user.id
    })
      .select('title company location jobType applications')
      .populate('company', 'name logo');
    
    // Extract applications for this user
    const applications = jobs.map(job => {
      const application = job.applications.find(
        app => app.applicant.toString() === req.user.id
      );
      
      return {
        jobId: job._id,
        applicationId: application._id,
        title: job.title,
        company: job.company,
        location: job.location,
        jobType: job.jobType,
        status: application.status,
        appliedAt: application.appliedAt,
        updatedAt: application.updatedAt
      };
    });
    
    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  })
);

/**
 * @route   GET /api/jobs/:id/applications
 * @desc    Get all applications for a job
 * @access  Private (Job poster or admin only)
 */
router.get(
  '/:id/applications',
  protect,
  asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Check ownership
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view applications for this job'
      });
    }
    
    // Populate applicant details
    const applications = await Job.findById(req.params.id)
      .select('applications')
      .populate('applications.applicant', 'name email location skills');
    
    res.status(200).json({
      success: true,
      count: applications.applications.length,
      data: applications.applications
    });
  })
);

/**
 * @route   PUT /api/jobs/:id/applications/:applicationId
 * @desc    Update application status
 * @access  Private (Job poster or admin only)
 */
router.put(
  '/:id/applications/:applicationId',
  protect,
  asyncHandler(async (req, res) => {
    const { status, notes } = req.body;
    
    // Validate status
    if (!['pending', 'reviewing', 'interviewed', 'offered', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Check ownership
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update applications for this job'
      });
    }
    
    // Find and update application
    const application = job.applications.id(req.params.applicationId);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    application.status = status;
    if (notes) application.notes = notes;
    application.updatedAt = Date.now();
    
    await job.save();
    
    res.status(200).json({
      success: true,
      data: application
    });
  })
);

/**
 * @route   POST /api/jobs/:id/save
 * @desc    Save a job to user's favorites
 * @access  Private
 */
router.post(
  '/:id/save',
  protect,
  asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Check if already saved
    if (job.isSavedByUser(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'Job already saved'
      });
    }
    
    // Add to saved jobs
    job.saved.push(req.user.id);
    await job.save();
    
    res.status(200).json({
      success: true,
      data: { message: 'Job saved successfully' }
    });
  })
);

/**
 * @route   DELETE /api/jobs/:id/save
 * @desc    Remove job from user's favorites
 * @access  Private
 */
router.delete(
  '/:id/save',
  protect,
  asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Check if saved
    if (!job.isSavedByUser(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'Job not in saved list'
      });
    }
    
    // Remove from saved jobs
    job.saved = job.saved.filter(id => id.toString() !== req.user.id);
    await job.save();
    
    res.status(200).json({
      success: true,
      data: { message: 'Job removed from saved list' }
    });
  })
);

/**
 * @route   GET /api/jobs/saved
 * @desc    Get all jobs saved by the user
 * @access  Private
 */
router.get(
  '/saved',
  protect,
  asyncHandler(async (req, res) => {
    const jobs = await Job.find({
      saved: req.user.id,
      isActive: true
    })
      .populate('company', 'name logo isVerified')
      .populate('skills', 'name category')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  })
);

/**
 * @route   GET /api/jobs/company/:companyId
 * @desc    Get all jobs for a specific company
 * @access  Public
 */
router.get(
  '/company/:companyId',
  asyncHandler(async (req, res) => {
    const jobs = await Job.find({
      company: req.params.companyId,
      isActive: true
    })
      .populate('skills', 'name category')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  })
);

module.exports = router; 