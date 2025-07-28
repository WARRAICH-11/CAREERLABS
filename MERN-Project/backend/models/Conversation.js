const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure participants are always sorted for consistent querying
ConversationSchema.pre('save', function(next) {
  this.participants.sort();
  next();
});

// Index for finding conversations by participants
ConversationSchema.index({ participants: 1 });

// Static method to find or create a conversation between two users
ConversationSchema.statics.findOrCreate = async function(participant1Id, participant2Id) {
  // Ensure IDs are sorted to maintain consistency
  const participants = [participant1Id, participant2Id].sort();
  
  let conversation = await this.findOne({
    participants: { $all: participants },
    $expr: { $eq: [{ $size: '$participants' }, 2] } // Ensure exactly 2 participants
  });
  
  if (!conversation) {
    conversation = await this.create({
      participants,
      unreadCount: {
        [participant1Id.toString()]: 0,
        [participant2Id.toString()]: 0
      }
    });
  }
  
  return conversation;
};

// Static method to get all conversations for a user with unread count
ConversationSchema.statics.getUserConversations = async function(userId) {
  return this.find({
    participants: userId,
    isActive: true
  })
  .populate('participants', 'name email profileImage')
  .populate('lastMessage')
  .sort({ updatedAt: -1 })
  .exec();
};

// Method to update conversation with a new message
ConversationSchema.methods.updateWithMessage = async function(messageId, senderId) {
  this.lastMessage = messageId;
  
  // Increment unread count for all participants except the sender
  this.participants.forEach(participantId => {
    const participantIdStr = participantId.toString();
    if (participantIdStr !== senderId.toString()) {
      const currentCount = this.unreadCount.get(participantIdStr) || 0;
      this.unreadCount.set(participantIdStr, currentCount + 1);
    }
  });
  
  return this.save();
};

// Method to mark conversation as read for a user
ConversationSchema.methods.markAsRead = async function(userId) {
  this.unreadCount.set(userId.toString(), 0);
  return this.save();
};

module.exports = mongoose.model('Conversation', ConversationSchema); 