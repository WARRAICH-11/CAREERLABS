const Notification = require('../models/Notification');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getUserNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const filter = req.query.filter === 'unread' ? { read: false } : {};
  
  const notifications = await Notification.find({
    recipient: req.user.id,
    ...filter
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .populate('sender', 'name profileImage')
  .exec();
  
  const total = await Notification.countDocuments({
    recipient: req.user.id,
    ...filter
  });
  
  res.status(200).json({
    success: true,
    data: notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get notification by ID
// @route   GET /api/notifications/:id
// @access  Private
const getNotificationById = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id)
    .populate('sender', 'name profileImage');
  
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  
  // Check if notification belongs to user
  if (notification.recipient.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to access this notification');
  }
  
  res.status(200).json({
    success: true,
    data: notification
  });
});

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  
  // Check if notification belongs to user
  if (notification.recipient.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to access this notification');
  }
  
  notification.read = true;
  await notification.save();
  
  res.status(200).json({
    success: true,
    data: notification
  });
});

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/mark-all-read
// @access  Private
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user.id, read: false },
    { read: true }
  );
  
  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  
  // Check if notification belongs to user
  if (notification.recipient.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to delete this notification');
  }
  
  await notification.deleteOne();
  
  res.status(200).json({
    success: true,
    message: 'Notification deleted'
  });
});

// @desc    Create system notification (admin only)
// @route   POST /api/notifications/system
// @access  Private/Admin
const createSystemNotification = asyncHandler(async (req, res) => {
  const { recipients, title, content, url, entityType, entityId, expiresAt } = req.body;
  
  if (!title || !content) {
    res.status(400);
    throw new Error('Title and content are required');
  }
  
  let userIds = [];
  
  if (recipients === 'all') {
    // Get all user IDs
    const users = await User.find().select('_id');
    userIds = users.map(user => user._id);
  } else if (recipients === 'role' && req.body.role) {
    // Get users by role
    const users = await User.find({ role: req.body.role }).select('_id');
    userIds = users.map(user => user._id);
  } else if (Array.isArray(recipients)) {
    // Specific user IDs
    userIds = recipients;
  } else {
    res.status(400);
    throw new Error('Invalid recipients specification');
  }
  
  // Create notifications in bulk
  const notificationPromises = userIds.map(userId => 
    Notification.createSystemNotification({
      recipient: userId,
      title,
      content,
      url,
      entityType,
      entityId,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    })
  );
  
  await Promise.all(notificationPromises);
  
  // Get socket.io instance
  const io = req.app.get('io');
  
  // Emit notification to all recipients
  userIds.forEach(userId => {
    io.to(`user-${userId}`).emit('notification', {
      type: 'system',
      title,
      content
    });
  });
  
  res.status(201).json({
    success: true,
    message: `Notifications sent to ${userIds.length} users`
  });
});

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    recipient: req.user.id,
    read: false
  });
  
  res.status(200).json({
    success: true,
    data: { count }
  });
});

module.exports = {
  getUserNotifications,
  getNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createSystemNotification,
  getUnreadCount
}; 