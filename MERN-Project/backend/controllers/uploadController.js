const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const Mentor = require('../models/Mentor');
const Session = require('../models/Session');
const Feedback = require('../models/Feedback');

// @desc    Upload file
// @route   POST /api/upload
// @access  Private
const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const file = req.file;
  const fileUrl = `/uploads/${file.filename}`;

  res.status(201).json({
    success: true,
    data: {
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: fileUrl
    }
  });
});

// @desc    Upload multiple files
// @route   POST /api/upload/multiple
// @access  Private
const uploadMultipleFiles = asyncHandler(async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    res.status(400);
    throw new Error('No files uploaded');
  }

  const filesData = [];

  // Handle multiple files from different fields
  Object.keys(req.files).forEach(fieldName => {
    req.files[fieldName].forEach(file => {
      const fileUrl = `/uploads/${file.filename}`;
      filesData.push({
        field: fieldName,
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: fileUrl
      });
    });
  });

  res.status(201).json({
    success: true,
    count: filesData.length,
    data: filesData
  });
});

// @desc    Upload resource for session or feedback
// @route   POST /api/upload/resource
// @access  Private
const uploadResource = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const { type, referenceType, referenceId, title, description } = req.body;

  if (!type || !referenceType || !referenceId) {
    res.status(400);
    throw new Error('Type, referenceType, and referenceId are required');
  }

  // Validate type
  if (!['session', 'feedback'].includes(referenceType)) {
    res.status(400);
    throw new Error('Reference type must be either "session" or "feedback"');
  }

  // Verify mentor access
  const mentor = await Mentor.findOne({ user: req.user._id });
  if (!mentor) {
    res.status(403);
    throw new Error('Only mentors can upload resources');
  }

  const file = req.file;
  const fileUrl = `/uploads/resources/${file.filename}`;

  // Create resource object
  const resource = {
    title: title || file.originalname,
    type: 'file',
    path: fileUrl,
    description: description || '',
    uploadedAt: Date.now()
  };

  let reference;

  // Add resource to the reference
  if (referenceType === 'session') {
    reference = await Session.findById(referenceId);
    if (!reference) {
      res.status(404);
      throw new Error('Session not found');
    }

    // Verify mentor authorization
    if (reference.mentor.toString() !== mentor._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to add resources to this session');
    }

    reference.resources.push(resource);
    await reference.save();
  } else {
    reference = await Feedback.findById(referenceId);
    if (!reference) {
      res.status(404);
      throw new Error('Feedback not found');
    }

    // Verify mentor authorization
    if (reference.mentor.toString() !== mentor._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to add resources to this feedback');
    }

    reference.resources.push(resource);
    await reference.save();
  }

  res.status(201).json({
    success: true,
    data: {
      resource,
      referenceType,
      referenceId
    }
  });
});

// @desc    Get file
// @route   GET /api/upload/:filename
// @access  Private
const getFile = asyncHandler(async (req, res) => {
  const { filename } = req.params;
  
  // Prepare file path
  const filePath = path.join(__dirname, '../uploads', filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error('File not found');
  }
  
  // Get file stats
  const stats = fs.statSync(filePath);
  
  // Determine content type
  const ext = path.extname(filename).toLowerCase();
  let contentType = 'application/octet-stream';
  
  switch (ext) {
    case '.pdf':
      contentType = 'application/pdf';
      break;
    case '.jpg':
    case '.jpeg':
      contentType = 'image/jpeg';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.doc':
      contentType = 'application/msword';
      break;
    case '.docx':
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      break;
    case '.txt':
      contentType = 'text/plain';
      break;
  }
  
  // Set headers
  res.set({
    'Content-Type': contentType,
    'Content-Length': stats.size
  });
  
  // Send file
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

// @desc    Delete file
// @route   DELETE /api/upload/:filename
// @access  Private
const deleteFile = asyncHandler(async (req, res) => {
  const { filename } = req.params;
  
  // Prepare file path
  const filePath = path.join(__dirname, '../uploads', filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error('File not found');
  }
  
  // Delete file
  fs.unlinkSync(filePath);
  
  res.status(200).json({
    success: true,
    message: 'File deleted successfully'
  });
});

module.exports = {
  uploadFile,
  uploadMultipleFiles,
  uploadResource,
  getFile,
  deleteFile
}; 