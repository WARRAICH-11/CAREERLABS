const express = require('express');
const router = express.Router();
const { protect, mentorOnly } = require('../middleware/authMiddleware');
const uploadController = require('../controllers/uploadController');
const upload = require('../middleware/uploadMiddleware');

// Single file upload
router.post('/', protect, upload.single('file'), uploadController.uploadFile);

// Multiple files upload
router.post('/multiple', protect, upload.fields([
  { name: 'files', maxCount: 5 },
  { name: 'images', maxCount: 5 },
  { name: 'documents', maxCount: 5 }
]), uploadController.uploadMultipleFiles);

// Resource upload for session or feedback
router.post('/resource', protect, mentorOnly, upload.single('file'), uploadController.uploadResource);

// Get file
router.get('/:filename', protect, uploadController.getFile);

// Delete file
router.delete('/:filename', protect, uploadController.deleteFile);

module.exports = router; 