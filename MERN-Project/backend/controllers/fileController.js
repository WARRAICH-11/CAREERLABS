const asyncHandler = require('express-async-handler');
const fs = require('fs');
const path = require('path');
const File = require('../models/File');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * @desc    Upload a file
 * @route   POST /api/files/upload
 * @access  Private
 */
const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const {
    originalname,
    mimetype,
    filename,
    size,
    path: filePath
  } = req.file;
  
  const { description, category, sessionId } = req.body;

  const file = await File.create({
    name: originalname,
    filename,
    mimetype,
    size,
    path: filePath,
    owner: req.user._id,
    description: description || '',
    category: category || 'Other',
    ...(sessionId && { associatedSessionId: sessionId })
  });

  res.status(201).json(file);
});

/**
 * @desc    Get all files uploaded by the user
 * @route   GET /api/files/myfiles
 * @access  Private
 */
const getMyFiles = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const category = req.query.category || '';

  const query = { owner: req.user._id };
  
  if (search) {
    query.$text = { $search: search };
  }
  
  if (category) {
    query.category = category;
  }

  const options = {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: {
      path: 'owner',
      select: 'name email'
    }
  };

  const files = await File.paginate(query, options);
  res.json(files);
});

/**
 * @desc    Get all files shared with the user
 * @route   GET /api/files/shared
 * @access  Private
 */
const getSharedWithMe = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const options = {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: {
      path: 'owner',
      select: 'name email'
    }
  };

  const query = { 
    'sharedWith': req.user._id 
  };

  const files = await File.paginate(query, options);
  res.json(files);
});

/**
 * @desc    Get files associated with a session
 * @route   GET /api/files/session/:sessionId
 * @access  Private
 */
const getSessionFiles = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    res.status(400);
    throw new Error('Invalid session ID');
  }

  const query = { 
    associatedSessionId: sessionId,
    $or: [
      { owner: req.user._id },
      { sharedWith: req.user._id }
    ]
  };

  const files = await File.find(query)
    .sort({ createdAt: -1 })
    .populate('owner', 'name email');

  res.json(files);
});

/**
 * @desc    Get a specific file by ID
 * @route   GET /api/files/:id
 * @access  Private
 */
const getFileById = asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.id)
    .populate('owner', 'name email')
    .populate('sharedWith', 'name email');

  if (!file) {
    res.status(404);
    throw new Error('File not found');
  }

  // Check access permissions
  if (!file.hasAccess(req.user._id)) {
    res.status(403);
    throw new Error('You do not have permission to access this file');
  }

  res.json(file);
});

/**
 * @desc    Download a file
 * @route   GET /api/files/:id/download
 * @access  Private
 */
const downloadFile = asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.id);

  if (!file) {
    res.status(404);
    throw new Error('File not found');
  }

  // Check access permissions
  if (!file.hasAccess(req.user._id)) {
    res.status(403);
    throw new Error('You do not have permission to download this file');
  }

  // Check if file exists on the server
  if (!fs.existsSync(file.path)) {
    res.status(404);
    throw new Error('File not found on server');
  }

  // Update download count and last downloaded
  file.downloadCount += 1;
  file.lastDownloaded = Date.now();
  await file.save();

  // Set headers and send file
  res.setHeader('Content-Type', file.mimetype);
  res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
  
  const fileStream = fs.createReadStream(file.path);
  fileStream.pipe(res);
});

/**
 * @desc    Update file details
 * @route   PUT /api/files/:id
 * @access  Private
 */
const updateFile = asyncHandler(async (req, res) => {
  const { name, description, category } = req.body;
  
  const file = await File.findById(req.params.id);

  if (!file) {
    res.status(404);
    throw new Error('File not found');
  }

  // Only allow the owner to update the file
  if (file.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You do not have permission to update this file');
  }

  file.name = name || file.name;
  file.description = description || file.description;
  file.category = category || file.category;

  const updatedFile = await file.save();
  res.json(updatedFile);
});

/**
 * @desc    Delete a file
 * @route   DELETE /api/files/:id
 * @access  Private
 */
const deleteFile = asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.id);

  if (!file) {
    res.status(404);
    throw new Error('File not found');
  }

  // Only allow the owner to delete the file
  if (file.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You do not have permission to delete this file');
  }

  await file.remove(); // This will trigger the pre-remove hook in the File model

  res.json({ message: 'File removed' });
});

/**
 * @desc    Share a file with other users
 * @route   POST /api/files/:id/share
 * @access  Private
 */
const shareFile = asyncHandler(async (req, res) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    res.status(400);
    throw new Error('Please provide valid user IDs to share with');
  }

  const file = await File.findById(req.params.id);

  if (!file) {
    res.status(404);
    throw new Error('File not found');
  }

  // Only allow the owner to share the file
  if (file.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You do not have permission to share this file');
  }

  // Validate user IDs and make sure they exist
  const usersToShare = await User.find({ _id: { $in: userIds } });
  
  if (usersToShare.length !== userIds.length) {
    res.status(400);
    throw new Error('One or more user IDs are invalid');
  }

  // Add users to sharedWith array (avoid duplicates)
  const validUserIds = usersToShare.map(user => user._id);
  
  for (const userId of validUserIds) {
    if (!file.sharedWith.includes(userId)) {
      file.sharedWith.push(userId);
    }
  }

  await file.save();
  
  res.json({
    message: 'File shared successfully',
    sharedWith: await User.find({ _id: { $in: file.sharedWith } }).select('name email')
  });
});

/**
 * @desc    Unshare a file with specific users
 * @route   POST /api/files/:id/unshare
 * @access  Private
 */
const unshareFile = asyncHandler(async (req, res) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    res.status(400);
    throw new Error('Please provide valid user IDs to unshare with');
  }

  const file = await File.findById(req.params.id);

  if (!file) {
    res.status(404);
    throw new Error('File not found');
  }

  // Only allow the owner to unshare the file
  if (file.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You do not have permission to unshare this file');
  }

  // Remove users from sharedWith array
  file.sharedWith = file.sharedWith.filter(
    userId => !userIds.includes(userId.toString())
  );

  await file.save();

  res.json({
    message: 'File unshared successfully',
    sharedWith: await User.find({ _id: { $in: file.sharedWith } }).select('name email')
  });
});

module.exports = {
  uploadFile,
  getMyFiles,
  getSharedWithMe,
  getSessionFiles,
  getFileById,
  downloadFile,
  updateFile,
  deleteFile,
  shareFile,
  unshareFile
}; 