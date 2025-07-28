const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  },
  attachments: [{
    type: String, // URL to file
    fileName: String,
    fileType: String,
    fileSize: Number
  }],
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation'
  }
}, {
  timestamps: true
});

// Index for querying messages between users
MessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

// Index for querying unread messages
MessageSchema.index({ recipient: 1, read: 1 });

// Static method to get conversation history between two users
MessageSchema.statics.getConversation = async function(user1Id, user2Id, limit = 20, skip = 0) {
  return this.find({
    $or: [
      { sender: user1Id, recipient: user2Id },
      { sender: user2Id, recipient: user1Id }
    ]
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .populate('sender', 'name profileImage')
  .exec();
};

// Static method to mark messages as read
MessageSchema.statics.markAsRead = async function(recipientId, senderId) {
  return this.updateMany(
    { recipient: recipientId, sender: senderId, read: false },
    { read: true }
  );
};

// Static method to get unread messages count
MessageSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    recipient: userId,
    read: false
  });
};

// Method to create notification for a new message
MessageSchema.methods.createNotification = async function() {
  const Notification = mongoose.model('Notification');
  return Notification.create({
    recipient: this.recipient,
    sender: this.sender,
    type: 'message',
    title: 'New Message',
    content: this.content.substring(0, 60) + (this.content.length > 60 ? '...' : ''),
    entityType: 'message',
    entityId: this._id,
    url: `/messages/${this.sender}`
  });
};

module.exports = mongoose.model('Message', MessageSchema); 