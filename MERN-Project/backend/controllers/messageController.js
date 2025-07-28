const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get user conversations
// @route   GET /api/messages/conversations
// @access  Private
const getUserConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.getUserConversations(req.user.id);
  
  // Format response to include other participant info and unread count
  const formattedConversations = conversations.map(conv => {
    const otherParticipants = conv.participants.filter(
      p => p._id.toString() !== req.user.id
    );
    
    return {
      _id: conv._id,
      participants: otherParticipants,
      lastMessage: conv.lastMessage,
      unreadCount: conv.unreadCount.get(req.user.id.toString()) || 0,
      updatedAt: conv.updatedAt
    };
  });
  
  res.status(200).json({
    success: true,
    data: formattedConversations
  });
});

// @desc    Get conversation messages
// @route   GET /api/messages/:userId
// @access  Private
const getConversationMessages = asyncHandler(async (req, res) => {
  const otherUserId = req.params.userId;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  
  // Verify other user exists
  const otherUser = await User.findById(otherUserId).select('name email profileImage');
  if (!otherUser) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Find or create conversation
  const conversation = await Conversation.findOrCreate(req.user.id, otherUserId);
  
  // Get messages
  const messages = await Message.getConversation(req.user.id, otherUserId, limit, skip);
  
  // Mark messages as read
  await Message.markAsRead(req.user.id, otherUserId);
  
  // Update conversation read status
  await conversation.markAsRead(req.user.id);
  
  res.status(200).json({
    success: true,
    data: {
      conversation: {
        _id: conversation._id,
        participant: otherUser
      },
      messages: messages.reverse() // Return in chronological order
    },
    pagination: {
      page,
      limit
    }
  });
});

// @desc    Send message
// @route   POST /api/messages/:userId
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { content, attachments } = req.body;
  const recipientId = req.params.userId;
  
  if (!content && (!attachments || attachments.length === 0)) {
    res.status(400);
    throw new Error('Message content or attachments are required');
  }
  
  // Verify recipient exists
  const recipient = await User.findById(recipientId);
  if (!recipient) {
    res.status(404);
    throw new Error('Recipient not found');
  }
  
  // Find or create conversation
  const conversation = await Conversation.findOrCreate(req.user.id, recipientId);
  
  // Create message
  const message = await Message.create({
    sender: req.user.id,
    recipient: recipientId,
    content: content || '',
    attachments,
    conversation: conversation._id
  });
  
  // Update conversation with new message
  await conversation.updateWithMessage(message._id, req.user.id);
  
  // Create notification for recipient
  await message.createNotification();
  
  // Populate sender info
  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'name profileImage');
  
  // Get socket.io instance
  const io = req.app.get('io');
  
  // Emit new message to recipient
  io.to(`user-${recipientId}`).emit('newMessage', {
    message: populatedMessage,
    conversation: conversation._id
  });
  
  res.status(201).json({
    success: true,
    data: populatedMessage
  });
});

// @desc    Get unread messages count
// @route   GET /api/messages/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Message.getUnreadCount(req.user.id);
  
  res.status(200).json({
    success: true,
    data: { count }
  });
});

// @desc    Delete message
// @route   DELETE /api/messages/message/:id
// @access  Private
const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  
  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }
  
  // Check if user is the sender
  if (message.sender.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to delete this message');
  }
  
  await message.deleteOne();
  
  res.status(200).json({
    success: true,
    message: 'Message deleted'
  });
});

module.exports = {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  getUnreadCount,
  deleteMessage
}; 