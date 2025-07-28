const asyncHandler = require('express-async-handler');
const Session = require('../models/Session');
const Mentor = require('../models/Mentor');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Create a session
// @route   POST /api/sessions
// @access  Private
const createSession = asyncHandler(async (req, res) => {
  const {
    mentorId,
    scheduledDate,
    startTime,
    endTime,
    duration,
    topic,
    description,
    sessionType
  } = req.body;

  // Validate mentor exists
  const mentor = await Mentor.findById(mentorId);
  if (!mentor) {
    res.status(404);
    throw new Error('Mentor not found');
  }

  // Validate if mentor is active
  if (!mentor.isActive) {
    res.status(400);
    throw new Error('This mentor is not currently accepting sessions');
  }

  // Check if the requested time slot is available
  const scheduledDay = new Date(scheduledDate).toLocaleDateString('en-US', { weekday: 'long' });
  const dayAvailability = mentor.availability.find(a => a.day === scheduledDay);
  
  if (!dayAvailability) {
    res.status(400);
    throw new Error(`Mentor is not available on ${scheduledDay}s`);
  }

  const isTimeSlotAvailable = dayAvailability.slots.some(
    slot => slot.startTime <= startTime && slot.endTime >= endTime && !slot.isBooked
  );

  if (!isTimeSlotAvailable) {
    res.status(400);
    throw new Error('The requested time slot is not available');
  }

  // Check for existing sessions at same time
  const existingSession = await Session.findOne({
    mentor: mentorId,
    scheduledDate: {
      $gte: new Date(scheduledDate).setHours(0, 0, 0, 0),
      $lt: new Date(scheduledDate).setHours(23, 59, 59, 999)
    },
    startTime,
    endTime,
    status: 'scheduled'
  });

  if (existingSession) {
    res.status(400);
    throw new Error('This time slot has already been booked');
  }

  // Create session
  const session = await Session.create({
    mentor: mentorId,
    user: req.user._id,
    scheduledDate,
    startTime,
    endTime,
    duration,
    topic,
    description,
    sessionType,
    status: 'scheduled'
  });

  // Update mentor's availability (mark slot as booked)
  await Mentor.findByIdAndUpdate(
    mentorId,
    {
      $set: {
        'availability.$[day].slots.$[slot].isBooked': true
      }
    },
    {
      arrayFilters: [
        { 'day.day': scheduledDay },
        { 'slot.startTime': { $lte: startTime }, 'slot.endTime': { $gte: endTime } }
      ]
    }
  );

  // If user is not already assigned to this mentor, add them
  if (!mentor.assignedUsers.includes(req.user._id)) {
    await Mentor.findByIdAndUpdate(
      mentorId,
      { $addToSet: { assignedUsers: req.user._id } }
    );
  }

  res.status(201).json({
    success: true,
    data: session
  });
});

// @desc    Get all sessions for current user (student or mentor)
// @route   GET /api/sessions
// @access  Private
const getSessions = asyncHandler(async (req, res) => {
  const { status, startDate, endDate, page = 1, limit = 10 } = req.query;
  const filter = {};
  
  // Check if user is a mentor
  const mentor = await Mentor.findOne({ user: req.user._id });
  
  if (mentor) {
    filter.mentor = mentor._id;
  } else {
    filter.user = req.user._id;
  }
  
  // Filter by status if provided
  if (status && ['scheduled', 'completed', 'cancelled', 'rescheduled'].includes(status)) {
    filter.status = status;
  }
  
  // Filter by date range if provided
  if (startDate || endDate) {
    filter.scheduledDate = {};
    
    if (startDate) {
      filter.scheduledDate.$gte = new Date(startDate);
    }
    
    if (endDate) {
      filter.scheduledDate.$lte = new Date(endDate);
    }
  }
  
  // Set up pagination
  const skip = (Number(page) - 1) * Number(limit);
  
  // Get sessions
  const sessions = await Session.find(filter)
    .populate('mentor', 'user')
    .populate({
      path: 'mentor',
      populate: {
        path: 'user',
        select: 'name email profileImage'
      }
    })
    .populate('user', 'name email profileImage')
    .sort('-scheduledDate')
    .skip(skip)
    .limit(Number(limit));
  
  // Get total count
  const total = await Session.countDocuments(filter);
  
  res.status(200).json({
    success: true,
    count: sessions.length,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    },
    data: sessions
  });
});

// @desc    Get session by ID
// @route   GET /api/sessions/:id
// @access  Private
const getSessionById = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id)
    .populate('mentor', 'user')
    .populate({
      path: 'mentor',
      populate: {
        path: 'user',
        select: 'name email profileImage'
      }
    })
    .populate('user', 'name email profileImage');
  
  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }
  
  // Check if user is authorized to view this session
  const mentor = await Mentor.findOne({ user: req.user._id });
  
  if (
    session.user._id.toString() !== req.user._id.toString() &&
    (!mentor || mentor._id.toString() !== session.mentor._id.toString())
  ) {
    res.status(403);
    throw new Error('Not authorized to view this session');
  }
  
  res.status(200).json({
    success: true,
    data: session
  });
});

// @desc    Update session status
// @route   PUT /api/sessions/:id/status
// @access  Private
const updateSessionStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  
  // Validate status
  if (!['scheduled', 'completed', 'cancelled', 'rescheduled'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }
  
  const session = await Session.findById(req.params.id);
  
  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }
  
  // Check authorization
  const mentor = await Mentor.findOne({ user: req.user._id });
  const isMentorForSession = mentor && mentor._id.toString() === session.mentor.toString();
  const isUserForSession = session.user.toString() === req.user._id.toString();
  
  if (!isMentorForSession && !isUserForSession) {
    res.status(403);
    throw new Error('Not authorized to update this session');
  }
  
  // If cancelling, check if it can be cancelled
  if (status === 'cancelled' && !session.canBeCancelled() && !isMentorForSession) {
    res.status(400);
    throw new Error('Session cannot be cancelled less than 24 hours before scheduled time');
  }
  
  // Update session status
  session.status = status;
  
  if (status === 'cancelled' && reason) {
    session.cancellationReason = reason;
  }
  
  // If cancelled, update mentor availability to free up the slot
  if (status === 'cancelled') {
    const scheduledDay = new Date(session.scheduledDate).toLocaleDateString('en-US', { weekday: 'long' });
    
    await Mentor.findByIdAndUpdate(
      session.mentor,
      {
        $set: {
          'availability.$[day].slots.$[slot].isBooked': false
        }
      },
      {
        arrayFilters: [
          { 'day.day': scheduledDay },
          { 'slot.startTime': { $lte: session.startTime }, 'slot.endTime': { $gte: session.endTime } }
        ]
      }
    );
  }
  
  await session.save();
  
  res.status(200).json({
    success: true,
    data: session
  });
});

// @desc    Add or update session notes (mentor only)
// @route   PUT /api/sessions/:id/notes
// @access  Private/Mentor
const updateSessionNotes = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  
  const session = await Session.findById(req.params.id);
  
  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }
  
  // Verify mentor authorization
  const mentor = await Mentor.findOne({ user: req.user._id });
  
  if (!mentor || mentor._id.toString() !== session.mentor.toString()) {
    res.status(403);
    throw new Error('Not authorized to update notes for this session');
  }
  
  // Update notes
  session.notes = notes;
  await session.save();
  
  res.status(200).json({
    success: true,
    data: session
  });
});

// @desc    Submit session feedback
// @route   PUT /api/sessions/:id/feedback
// @access  Private
const submitSessionFeedback = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  
  const session = await Session.findById(req.params.id);
  
  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }
  
  // Check if status is completed
  if (session.status !== 'completed') {
    res.status(400);
    throw new Error('Feedback can only be provided for completed sessions');
  }
  
  // Check authorization
  const mentor = await Mentor.findOne({ user: req.user._id });
  const isMentorForSession = mentor && mentor._id.toString() === session.mentor.toString();
  const isUserForSession = session.user.toString() === req.user._id.toString();
  
  if (!isMentorForSession && !isUserForSession) {
    res.status(403);
    throw new Error('Not authorized to provide feedback for this session');
  }
  
  // Update feedback
  if (isUserForSession) {
    // User providing feedback
    if (rating < 1 || rating > 5) {
      res.status(400);
      throw new Error('Rating must be between 1 and 5');
    }
    
    session.feedback.user = {
      rating,
      comment,
      submittedAt: Date.now()
    };
    
    // Update mentor rating
    if (rating) {
      const mentorToUpdate = await Mentor.findById(session.mentor);
      const currentTotal = mentorToUpdate.rating.average * mentorToUpdate.rating.count;
      mentorToUpdate.rating.count += 1;
      mentorToUpdate.rating.average = (currentTotal + rating) / mentorToUpdate.rating.count;
      await mentorToUpdate.save();
    }
  } else {
    // Mentor providing feedback
    session.feedback.mentor = {
      comment,
      submittedAt: Date.now()
    };
  }
  
  await session.save();
  
  res.status(200).json({
    success: true,
    data: session
  });
});

// @desc    Add resource to session
// @route   POST /api/sessions/:id/resources
// @access  Private/Mentor
const addSessionResource = asyncHandler(async (req, res) => {
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
  
  const session = await Session.findById(req.params.id);
  
  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }
  
  // Verify mentor authorization
  const mentor = await Mentor.findOne({ user: req.user._id });
  
  if (!mentor || mentor._id.toString() !== session.mentor.toString()) {
    res.status(403);
    throw new Error('Not authorized to add resources to this session');
  }
  
  // Add resource
  const resource = {
    title,
    type,
    path,
    description,
    uploadedAt: Date.now()
  };
  
  session.resources.push(resource);
  await session.save();
  
  res.status(201).json({
    success: true,
    data: session
  });
});

// @desc    Add action item to session
// @route   POST /api/sessions/:id/action-items
// @access  Private/Mentor
const addSessionActionItem = asyncHandler(async (req, res) => {
  const { description, dueDate } = req.body;
  
  // Validate input
  if (!description) {
    res.status(400);
    throw new Error('Description is required');
  }
  
  const session = await Session.findById(req.params.id);
  
  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }
  
  // Verify mentor authorization
  const mentor = await Mentor.findOne({ user: req.user._id });
  
  if (!mentor || mentor._id.toString() !== session.mentor.toString()) {
    res.status(403);
    throw new Error('Not authorized to add action items to this session');
  }
  
  // Add action item
  const actionItem = {
    description,
    isCompleted: false,
    dueDate: dueDate ? new Date(dueDate) : undefined
  };
  
  session.actionItems.push(actionItem);
  await session.save();
  
  res.status(201).json({
    success: true,
    data: session
  });
});

// @desc    Update action item status
// @route   PUT /api/sessions/:id/action-items/:actionItemId
// @access  Private
const updateActionItemStatus = asyncHandler(async (req, res) => {
  const { isCompleted } = req.body;
  
  if (isCompleted === undefined) {
    res.status(400);
    throw new Error('isCompleted field is required');
  }
  
  const session = await Session.findById(req.params.id);
  
  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }
  
  // Check authorization (both mentor and user can update action item status)
  const mentor = await Mentor.findOne({ user: req.user._id });
  const isMentorForSession = mentor && mentor._id.toString() === session.mentor.toString();
  const isUserForSession = session.user.toString() === req.user._id.toString();
  
  if (!isMentorForSession && !isUserForSession) {
    res.status(403);
    throw new Error('Not authorized to update action items for this session');
  }
  
  // Find action item by ID
  const actionItem = session.actionItems.id(req.params.actionItemId);
  
  if (!actionItem) {
    res.status(404);
    throw new Error('Action item not found');
  }
  
  // Update status
  actionItem.isCompleted = isCompleted;
  await session.save();
  
  res.status(200).json({
    success: true,
    data: session
  });
});

module.exports = {
  createSession,
  getSessions,
  getSessionById,
  updateSessionStatus,
  updateSessionNotes,
  submitSessionFeedback,
  addSessionResource,
  addSessionActionItem,
  updateActionItemStatus
}; 