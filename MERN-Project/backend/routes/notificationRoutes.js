const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

// Get user notifications
router.get('/', protect, notificationController.getUserNotifications);

// Get unread count
router.get('/unread-count', protect, notificationController.getUnreadCount);

// Mark all notifications as read
router.patch('/mark-all-read', protect, notificationController.markAllNotificationsAsRead);

// Create system notification (admin only)
router.post('/system', protect, authorize('admin'), notificationController.createSystemNotification);

// Get, mark as read or delete specific notification
router.get('/:id', protect, notificationController.getNotificationById);
router.patch('/:id/read', protect, notificationController.markNotificationAsRead);
router.delete('/:id', protect, notificationController.deleteNotification);

module.exports = router; 