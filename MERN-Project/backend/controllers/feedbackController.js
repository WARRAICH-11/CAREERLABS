const asyncHandler = require('express-async-handler');
const Feedback = require('../models/Feedback');
const Mentor = require('../models/Mentor');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Create feedback
// @route   POST /api/feedback
// @access  Private/Mentor
const createFeedback = asyncHandler(async (req, res) => {
  const {
    userId,
    type,
    referenceId,
    referenceModel,
    title,
    content,
    rating,
    recommendations,
    strengths,
    areasForImprovement,
    resources,
    actionItems
  } = req.body;

  // Verify mentor access
  const mentor = await Mentor.findOne({ user: req.user._id });
  if (!mentor) {
    res.status(403);
    throw new Error('You are not authorized to provide feedback as a mentor');
  }

  // Verify if the user is assigned to this mentor
  if (!mentor.assignedUsers.includes(userId)) {
    res.status(403);
    throw new Error('You can only provide feedback to users assigned to you');
  }

  // Verify user exists
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Verify reference model if provided
  if (referenceId && referenceModel) {
    // Check if the reference model exists
    try {
      const Model = mongoose.model(referenceModel);
      const reference = await Model.findById(referenceId);
      
      if (!reference) {
        res.status(404);
        throw new Error(`${referenceModel} with ID ${referenceId} not found`);
      }
      
      // Verify the reference belongs to the user
      if (reference.user && reference.user.toString() !== userId) {
        res.status(403);
        throw new Error(`This ${referenceModel} does not belong to the specified user`);
      }
    } catch (err) {
      if (err.name === 'MissingSchemaError') {
        res.status(400);
        throw new Error(`Invalid reference model: ${referenceModel}`);
      }
      throw err;
    }
  }

  // Create feedback
  const feedback = await Feedback.create({
    mentor: mentor._id,
    user: userId,
    type,
    referenceId,
    referenceModel,
    title,
    content,
    rating,
    recommendations,
    strengths,
    areasForImprovement,
    resources,
    actionItems,
    isRead: false
  });

  res.status(201).json({
    success: true,
    data: feedback
  });
});

// @desc    Get all feedback (filtered by mentor or user)
// @route   GET /api/feedback
// @access  Private
const getFeedback = asyncHandler(async (req, res) => {
  const { type, referenceId, referenceModel, isRead, page = 1, limit = 10 } = req.query;
  const filter = {};
  
  // Check if user is a mentor
  const mentor = await Mentor.findOne({ user: req.user._id });
  
  if (mentor) {
    // Mentor can see all feedback they've provided
    filter.mentor = mentor._id;
  } else {
    // User can only see feedback for themselves
    filter.user = req.user._id;
  }
  
  // Apply filters
  if (type) {
    filter.type = type;
  }
  
  if (referenceId) {
    filter.referenceId = referenceId;
  }
  
  if (referenceModel) {
    filter.referenceModel = referenceModel;
  }
  
  if (isRead !== undefined) {
    filter.isRead = isRead === 'true';
  }
  
  // Set up pagination
  const skip = (Number(page) - 1) * Number(limit);
  
  // Get feedback
  const feedback = await Feedback.find(filter)
    .populate('mentor', 'user')
    .populate({
      path: 'mentor',
      populate: {
        path: 'user',
        select: 'name email profileImage'
      }
    })
    .populate('user', 'name email profileImage')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit));
  
  // Get total count
  const total = await Feedback.countDocuments(filter);
  
  res.status(200).json({
    success: true,
    count: feedback.length,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    },
    data: feedback
  });
});

// @desc    Get feedback by ID
// @route   GET /api/feedback/:id
// @access  Private
const getFeedbackById = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findById(req.params.id)
    .populate('mentor', 'user')
    .populate({
      path: 'mentor',
      populate: {
        path: 'user',
        select: 'name email profileImage'
      }
    })
    .populate('user', 'name email profileImage');
  
  if (!feedback) {
    res.status(404);
    throw new Error('Feedback not found');
  }
  
  // Check authorization
  const mentor = await Mentor.findOne({ user: req.user._id });
  const isMentorForFeedback = mentor && mentor._id.toString() === feedback.mentor._id.toString();
  const isUserForFeedback = feedback.user._id.toString() === req.user._id.toString();
  
  if (!isMentorForFeedback && !isUserForFeedback) {
    res.status(403);
    throw new Error('Not authorized to access this feedback');
  }
  
  // If user is viewing, mark as read
  if (isUserForFeedback && !feedback.isRead) {
    feedback.isRead = true;
    await feedback.save();
  }
  
  res.status(200).json({
    success: true,
    data: feedback
  });
});

// @desc    Update feedback content (mentor only)
// @route   PUT /api/feedback/:id
// @access  Private/Mentor
const updateFeedback = asyncHandler(async (req, res) => {
  const {
    title,
    content,
    rating,
    recommendations,
    strengths,
    areasForImprovement,
    actionItems
  } = req.body;
  
  const feedback = await Feedback.findById(req.params.id);
  
  if (!feedback) {
    res.status(404);
    throw new Error('Feedback not found');
  }
  
  // Verify mentor authorization
  const mentor = await Mentor.findOne({ user: req.user._id });
  
  if (!mentor || mentor._id.toString() !== feedback.mentor.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this feedback');
  }
  
  // Update fields
  if (title) feedback.title = title;
  if (content) feedback.content = content;
  if (rating) feedback.rating = rating;
  if (recommendations) feedback.recommendations = recommendations;
  if (strengths) feedback.strengths = strengths;
  if (areasForImprovement) feedback.areasForImprovement = areasForImprovement;
  if (actionItems) feedback.actionItems = actionItems;
  
  // Mark as unread since content changed
  feedback.isRead = false;
  
  const updatedFeedback = await feedback.save();
  
  res.status(200).json({
    success: true,
    data: updatedFeedback
  });
});

// @desc    Add resource to feedback
// @route   POST /api/feedback/:id/resources
// @access  Private/Mentor
const addFeedbackResource = asyncHandler(async (req, res) => {
  const { title, type, path, description } = req.body;
  
  // Validate input
  if (!title || !type || !path) {
    res.status(400);
    throw new Error('Title, type, and path are required');
  }
  
  if (!['file', 'link'].includes(type)) {
    res.status(400);
    throw new Error('Resource type must be either "file" or "link"');
  }
  
  const feedback = await Feedback.findById(req.params.id);
  
  if (!feedback) {
    res.status(404);
    throw new Error('Feedback not found');
  }
  
  // Verify mentor authorization
  const mentor = await Mentor.findOne({ user: req.user._id });
  
  if (!mentor || mentor._id.toString() !== feedback.mentor.toString()) {
    res.status(403);
    throw new Error('Not authorized to add resources to this feedback');
  }
  
  // Add resource
  const resource = {
    title,
    type,
    path,
    description,
    uploadedAt: Date.now()
  };
  
  feedback.resources.push(resource);
  await feedback.save();
  
  res.status(201).json({
    success: true,
    data: feedback
  });
});

// @desc    Add user response to feedback
// @route   POST /api/feedback/:id/response
// @access  Private
const addUserResponse = asyncHandler(async (req, res) => {
  const { content } = req.body;
  
  if (!content) {
    res.status(400);
    throw new Error('Response content is required');
  }
  
  const feedback = await Feedback.findById(req.params.id);
  
  if (!feedback) {
    res.status(404);
    throw new Error('Feedback not found');
  }
  
  // Verify user authorization
  if (feedback.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to respond to this feedback');
  }
  
  // Add response
  feedback.userResponse = {
    content,
    submittedAt: Date.now()
  };
  
  await feedback.save();
  
  res.status(200).json({
    success: true,
    data: feedback
  });
});

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
// @access  Private/Mentor
const deleteFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findById(req.params.id);
  
  if (!feedback) {
    res.status(404);
    throw new Error('Feedback not found');
  }
  
  // Verify mentor authorization
  const mentor = await Mentor.findOne({ user: req.user._id });
  
  if (!mentor || mentor._id.toString() !== feedback.mentor.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this feedback');
  }
  
  await feedback.remove();
  
  res.status(200).json({
    success: true,
    message: 'Feedback deleted successfully'
  });
});

module.exports = {
  createFeedback,
  getFeedback,
  getFeedbackById,
  updateFeedback,
  addFeedbackResource,
  addUserResponse,
  deleteFeedback
}; 