const express = require('express');
const router = express.Router();
const jobApplicationController = require('../controllers/jobApplicationController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// User routes
router.post('/submit', protect, upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'coverLetter', maxCount: 1 }
]), jobApplicationController.submitApplication);

router.get('/user', protect, jobApplicationController.getUserApplications);
router.get('/download/:fileId', protect, jobApplicationController.downloadDocument);
router.put('/:id/withdraw', protect, jobApplicationController.withdrawApplication);

// Admin routes
router.get('/', protect, authorize('admin'), jobApplicationController.getAllApplications);
router.get('/job/:jobId', protect, authorize('admin'), jobApplicationController.getApplicationsByJob);
router.put('/:id/status', protect, authorize('admin'), jobApplicationController.updateApplicationStatus);
router.get('/:id', protect, jobApplicationController.getApplicationById);
router.delete('/:id', protect, authorize('admin'), jobApplicationController.deleteApplication);

module.exports = router; 