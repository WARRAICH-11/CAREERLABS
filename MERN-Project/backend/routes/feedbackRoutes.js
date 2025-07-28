const express = require('express');
const router = express.Router();
const { protect, mentorOnly } = require('../middleware/authMiddleware');
const feedbackController = require('../controllers/feedbackController');

// Base routes
router.post('/', protect, mentorOnly, feedbackController.createFeedback);
router.get('/', protect, feedbackController.getFeedback);
router.get('/:id', protect, feedbackController.getFeedbackById);

// Mentor-only routes
router.put('/:id', protect, mentorOnly, feedbackController.updateFeedback);
router.post('/:id/resources', protect, mentorOnly, feedbackController.addFeedbackResource);
router.delete('/:id', protect, mentorOnly, feedbackController.deleteFeedback);

// User routes
router.post('/:id/response', protect, feedbackController.addUserResponse);

module.exports = router; 