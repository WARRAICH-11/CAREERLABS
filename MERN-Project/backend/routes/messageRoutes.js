const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const messageController = require('../controllers/messageController');

// Get user conversations
router.get('/conversations', protect, messageController.getUserConversations);

// Get unread messages count
router.get('/unread-count', protect, messageController.getUnreadCount);

// Delete specific message
router.delete('/message/:id', protect, messageController.deleteMessage);

// Get and send messages to a specific user
router.get('/:userId', protect, messageController.getConversationMessages);
router.post('/:userId', protect, messageController.sendMessage);

module.exports = router; 