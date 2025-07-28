const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const { importData, importDataFromDirectory } = require('../services/importService');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Use original filename
    cb(null, file.originalname);
  }
});

// File filter to accept only JSON files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/json' || path.extname(file.originalname) === '.json') {
    cb(null, true);
  } else {
    cb(new Error('Only JSON files are allowed'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// @route   POST /api/import/upload
// @desc    Upload and import skills and jobs from JSON files
// @access  Private/Admin
router.post(
  '/upload',
  protect,
  authorize('admin'),
  upload.fields([
    { name: 'skills', maxCount: 1 },
    { name: 'jobs', maxCount: 1 }
  ]),
  asyncHandler(async (req, res) => {
    if (!req.files || !req.files.skills || !req.files.jobs) {
      return res.status(400).json({
        success: false,
        message: 'Both skills and jobs files are required'
      });
    }
    
    const skillsFilePath = req.files.skills[0].path;
    const jobsFilePath = req.files.jobs[0].path;
    
    const result = await importData(skillsFilePath, jobsFilePath);
    
    // Clean up uploaded files
    fs.unlinkSync(skillsFilePath);
    fs.unlinkSync(jobsFilePath);
    
    // Return results
    return res.status(result.success ? 200 : 400).json({
      success: result.success,
      data: result,
      message: result.success 
        ? `Import completed: ${result.skills.imported} skills and ${result.jobs.imported} jobs imported`
        : `Import failed: ${result.error}`
    });
  })
);

// @route   POST /api/import/directory
// @desc    Import skills and jobs from a specified directory
// @access  Private/Admin
router.post(
  '/directory',
  protect,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { directoryPath } = req.body;
    
    if (!directoryPath) {
      return res.status(400).json({
        success: false,
        message: 'Directory path is required'
      });
    }
    
    try {
      // Check if directory exists
      if (!fs.existsSync(directoryPath)) {
        return res.status(400).json({
          success: false,
          message: `Directory not found: ${directoryPath}`
        });
      }
      
      const result = await importDataFromDirectory(directoryPath);
      
      return res.status(result.success ? 200 : 400).json({
        success: result.success,
        data: result,
        message: result.success 
          ? `Import completed: ${result.skills.imported} skills and ${result.jobs.imported} jobs imported`
          : `Import failed: ${result.error}`
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  })
);

// @route   GET /api/import/status
// @desc    Get status of previous imports
// @access  Private/Admin
router.get(
  '/status',
  protect,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    // Read from import log file if available
    const logFilePath = path.join(__dirname, '../logs/import.log');
    
    if (!fs.existsSync(logFilePath)) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    const logData = fs.readFileSync(logFilePath, 'utf8');
    const logs = logData.split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
    
    return res.status(200).json({
      success: true,
      data: logs
    });
  })
);

// Utility function to log import results
const logImportResult = (result) => {
  const logDir = path.join(__dirname, '../logs');
  const logFile = path.join(logDir, 'import.log');
  
  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logEntry = JSON.stringify({
    timestamp: new Date(),
    success: result.success,
    skillsImported: result.skills.imported,
    jobsImported: result.jobs.imported,
    skillsSkipped: result.skills.skipped,
    jobsSkipped: result.jobs.skipped,
    error: result.error || null
  });
  
  fs.appendFileSync(logFile, logEntry + '\n');
};

module.exports = router; 