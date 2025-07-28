const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['message', 'job_alert', 'session_reminder', 'application_update', 'system', 'assessment'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    // This could reference a job, session, message, etc.
  },
  entityType: {
    type: String,
    enum: ['job', 'session', 'message', 'application', 'assessment', 'feedback']
  },
  url: {
    type: String
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for querying unread notifications
NotificationSchema.index({ recipient: 1, read: 1 });

// Index for expiring notifications
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to mark notification as read
NotificationSchema.methods.markAsRead = async function() {
  this.read = true;
  return this.save();
};

// Static method to create system notification
NotificationSchema.statics.createSystemNotification = async function(data) {
  return this.create({
    recipient: data.recipient,
    type: 'system',
    title: data.title,
    content: data.content,
    url: data.url,
    entityType: data.entityType,
    entityId: data.entityId,
    expiresAt: data.expiresAt
  });
};

// Static method to create job alert notification
NotificationSchema.statics.createJobAlert = async function(data) {
  return this.create({
    recipient: data.recipient,
    type: 'job_alert',
    title: data.title || 'New Job Alert',
    content: data.content,
    entityType: 'job',
    entityId: data.jobId,
    url: `/jobs/${data.jobId}`,
    expiresAt: data.expiresAt
  });
};

// Static method to create session reminder notification
NotificationSchema.statics.createSessionReminder = async function(data) {
  return this.create({
    recipient: data.recipient,
    type: 'session_reminder',
    title: data.title || 'Session Reminder',
    content: data.content,
    entityType: 'session',
    entityId: data.sessionId,
    url: `/sessions/${data.sessionId}`,
    expiresAt: data.expiresAt
  });
};

// Static method to get unread notifications for a user
NotificationSchema.statics.getUnreadByUser = async function(userId) {
  return this.find({ 
    recipient: userId,
    read: false 
  })
  .sort({ createdAt: -1 })
  .populate('sender', 'name profileImage')
  .exec();
};

// Static method to mark all notifications as read for a user
NotificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { recipient: userId, read: false },
    { read: true }
  );
};

module.exports = mongoose.model('Notification', NotificationSchema); 