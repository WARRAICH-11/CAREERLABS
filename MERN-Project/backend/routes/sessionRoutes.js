const express = require('express');
const router = express.Router();
const { protect, mentorOnly } = require('../middleware/authMiddleware');
const sessionController = require('../controllers/sessionController');
const upload = require('../middleware/uploadMiddleware');

// Base routes
router.post('/', protect, sessionController.createSession);
router.get('/', protect, sessionController.getSessions);
router.get('/:id', protect, sessionController.getSessionById);

// Session status routes
router.put('/:id/status', protect, sessionController.updateSessionStatus);

// Session notes routes (mentor only)
router.put('/:id/notes', protect, mentorOnly, sessionController.updateSessionNotes);

// Session feedback routes
router.put('/:id/feedback', protect, sessionController.submitSessionFeedback);

// Session resources routes (mentor only)
router.post('/:id/resources', protect, mentorOnly, sessionController.addSessionResource);

// Session action items routes
router.post('/:id/action-items', protect, mentorOnly, sessionController.addSessionActionItem);
router.put('/:id/action-items/:actionItemId', protect, sessionController.updateActionItemStatus);

module.exports = router; 