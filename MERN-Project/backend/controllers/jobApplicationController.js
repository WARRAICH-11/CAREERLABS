const asyncHandler = require('express-async-handler');
const JobApplication = require('../models/JobApplication');
const Job = require('../models/Job');
const User = require('../models/User');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads/applications';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only .pdf, .doc and .docx formats are allowed!'), false);
  }
};

// Initialize multer upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB limit
  },
  fileFilter: fileFilter
});

// Middleware to handle file uploads
const uploadFiles = (req, res, next) => {
  const uploadMiddleware = upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'coverLetter', maxCount: 1 }
  ]);

  uploadMiddleware(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Multer error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// @desc    Submit a job application
// @route   POST /api/applications
// @access  Private
const submitApplication = asyncHandler(async (req, res) => {
  const {
    jobId,
    firstName,
    lastName,
    email,
    phone,
    linkedin,
    portfolio,
    referredBy
  } = req.body;

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error('Job not found');
  }

  // Get file paths if files were uploaded
  const resumePath = req.files && req.files.resume ? req.files.resume[0].path : null;
  const coverLetterPath = req.files && req.files.coverLetter ? req.files.coverLetter[0].path : null;

  if (!resumePath) {
    res.status(400);
    throw new Error('Resume is required');
  }

  // Create application
  const application = await JobApplication.create({
    job: jobId,
    user: req.user._id,
    firstName,
    lastName,
    email,
    phone,
    linkedin,
    portfolio,
    referredBy,
    resumePath,
    coverLetterPath,
    status: 'submitted',
    statusHistory: [
      {
        status: 'submitted',
        date: Date.now(),
        note: 'Application submitted'
      }
    ]
  });

  res.status(201).json({
    _id: application._id,
    status: application.status,
    message: 'Application submitted successfully'
  });
});

// @desc    Get all applications for a specific job
// @route   GET /api/applications/job/:jobId
// @access  Private (Admin)
const getJobApplications = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const job = await Job.findById(jobId);
  
  if (!job) {
    res.status(404);
    throw new Error('Job not found');
  }

  // Only admins can see all applications for a job
  if (!req.user.isAdmin) {
    res.status(403);
    throw new Error('Not authorized to access all applications');
  }

  const applications = await JobApplication.find({ job: jobId })
    .populate('user', 'name email')
    .sort('-createdAt');

  res.json(applications);
});

// @desc    Get all applications for the logged-in user
// @route   GET /api/applications/user
// @access  Private
const getUserApplications = asyncHandler(async (req, res) => {
  const applications = await JobApplication.find({ user: req.user._id })
    .populate('job', 'title company location')
    .sort('-createdAt');

  res.json(applications);
});

// @desc    Get application by ID
// @route   GET /api/applications/:id
// @access  Private
const getApplicationById = asyncHandler(async (req, res) => {
  const application = await JobApplication.findById(req.params.id)
    .populate('job', 'title company location description')
    .populate('user', 'name email');

  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  // Check if user is authorized to view this application
  if (!req.user.isAdmin && application.user._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to view this application');
  }

  res.json(application);
});

// @desc    Update application status
// @route   PUT /api/applications/:id/status
// @access  Private (Admin)
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  // Validate status
  const validStatuses = ['submitted', 'reviewing', 'interview', 'offered', 'rejected', 'accepted', 'withdrawn'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  const application = await JobApplication.findById(req.params.id);

  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  // Only admins can update status (except for 'withdrawn' which can be done by the applicant)
  if (!req.user.isAdmin && (status !== 'withdrawn' || application.user.toString() !== req.user._id.toString())) {
    res.status(403);
    throw new Error('Not authorized to update this application');
  }

  // Update application status
  application.status = status;
  application.statusHistory.push({
    status,
    date: Date.now(),
    note: note || `Status updated to ${status}`
  });

  const updatedApplication = await application.save();

  res.json({
    _id: updatedApplication._id,
    status: updatedApplication.status,
    message: 'Application status updated successfully'
  });
});

// @desc    Download resume or cover letter
// @route   GET /api/applications/:id/download/:documentType
// @access  Private
const downloadDocument = asyncHandler(async (req, res) => {
  const { id, documentType } = req.params;

  if (!['resume', 'coverLetter'].includes(documentType)) {
    res.status(400);
    throw new Error('Invalid document type');
  }

  const application = await JobApplication.findById(id);

  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  // Check if user is authorized to download this document
  if (!req.user.isAdmin && application.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to download this document');
  }

  const filePath = documentType === 'resume' ? application.resumePath : application.coverLetterPath;

  if (!filePath) {
    res.status(404);
    throw new Error(`No ${documentType} found for this application`);
  }

  res.download(filePath);
});

// @desc    Withdraw an application
// @route   PUT /api/applications/:id/withdraw
// @access  Private
const withdrawApplication = asyncHandler(async (req, res) => {
  const application = await JobApplication.findById(req.params.id);

  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  // Only the applicant can withdraw their application
  if (application.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to withdraw this application');
  }

  // Update application status
  application.status = 'withdrawn';
  application.statusHistory.push({
    status: 'withdrawn',
    date: Date.now(),
    note: 'Application withdrawn by applicant'
  });

  const updatedApplication = await application.save();

  res.json({
    _id: updatedApplication._id,
    status: updatedApplication.status,
    message: 'Application withdrawn successfully'
  });
});

// @desc    Get all applications (admin only)
// @route   GET /api/applications
// @access  Private (Admin)
const getAllApplications = asyncHandler(async (req, res) => {
  const applications = await JobApplication.find({})
    .populate('job', 'title company location')
    .populate('user', 'name email')
    .sort('-createdAt');

  res.json(applications);
});

// @desc    Get applications by job ID (admin only)
// @route   GET /api/applications/job/:jobId
// @access  Private (Admin)
const getApplicationsByJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const job = await Job.findById(jobId);
  
  if (!job) {
    res.status(404);
    throw new Error('Job not found');
  }

  const applications = await JobApplication.find({ job: jobId })
    .populate('user', 'name email')
    .sort('-createdAt');

  res.json(applications);
});

// @desc    Delete an application (admin only)
// @route   DELETE /api/applications/:id
// @access  Private (Admin)
const deleteApplication = asyncHandler(async (req, res) => {
  const application = await JobApplication.findById(req.params.id);

  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  // Delete associated files
  if (application.resumePath && fs.existsSync(application.resumePath)) {
    fs.unlinkSync(application.resumePath);
  }
  
  if (application.coverLetterPath && fs.existsSync(application.coverLetterPath)) {
    fs.unlinkSync(application.coverLetterPath);
  }

  await application.deleteOne();

  res.json({ message: 'Application deleted successfully' });
});

module.exports = {
  uploadFiles,
  submitApplication,
  getJobApplications,
  getUserApplications,
  getApplicationById,
  updateApplicationStatus,
  downloadDocument,
  withdrawApplication,
  getAllApplications,
  getApplicationsByJob,
  deleteApplication
}; 