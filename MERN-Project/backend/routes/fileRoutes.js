const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
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
} = require('../controllers/fileController');

// Upload a file
router.post('/upload', protect, upload.single('file'), uploadFile);

// Get all files uploaded by the user
router.get('/myfiles', protect, getMyFiles);

// Get all files shared with the user
router.get('/shared', protect, getSharedWithMe);

// Get files associated with a session
router.get('/session/:sessionId', protect, getSessionFiles);

// Get a specific file by ID
router.get('/:id', protect, getFileById);

// Download a file
router.get('/:id/download', protect, downloadFile);

// Update file details
router.put('/:id', protect, updateFile);

// Delete a file
router.delete('/:id', protect, deleteFile);

// Share a file with other users
router.post('/:id/share', protect, shareFile);

// Unshare a file with specific users
router.post('/:id/unshare', protect, unshareFile);

module.exports = router; 