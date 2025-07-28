const express = require('express');
const router = express.Router();
const { protect, mentorOnly } = require('../middleware/authMiddleware');
const mentorController = require('../controllers/mentorController');

// Public routes
router.get('/', mentorController.getMentors);
router.get('/:id', mentorController.getMentorById);

// Protected routes (user must be logged in)
router.post('/', protect, mentorController.registerAsMentor);

// Protected routes (user must be a mentor)
router.get('/dashboard/data', protect, mentorOnly, mentorController.getMentorDashboard);
router.get('/assigned-users', protect, mentorOnly, mentorController.getAssignedUsers);
router.get('/users/:userId', protect, mentorOnly, mentorController.getUserForMentor);
router.put('/profile', protect, mentorOnly, mentorController.updateMentorProfile);

module.exports = router; 