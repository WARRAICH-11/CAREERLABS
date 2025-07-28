const asyncHandler = require('express-async-handler');
const Mentor = require('../models/Mentor');
const User = require('../models/User');
const Session = require('../models/Session');
const Feedback = require('../models/Feedback');

// @desc    Register as a mentor (for existing users)
// @route   POST /api/mentors
// @access  Private
const registerAsMentor = asyncHandler(async (req, res) => {
  const {
    specializations,
    expertise,
    yearsOfExperience,
    bio,
    rate,
    availability,
    education,
    certifications,
    languages
  } = req.body;

  // Check if user is already a mentor
  const existingMentor = await Mentor.findOne({ user: req.user._id });
  if (existingMentor) {
    res.status(400);
    throw new Error('You are already registered as a mentor');
  }

  // Create mentor profile
  const mentor = await Mentor.create({
    user: req.user._id,
    specializations,
    expertise,
    yearsOfExperience,
    bio,
    rate,
    availability,
    education,
    certifications,
    languages
  });

  // Update user role to include mentor
  await User.findByIdAndUpdate(
    req.user._id,
    { $addToSet: { roles: 'mentor' } }
  );

  res.status(201).json({
    success: true,
    data: mentor
  });
});

// @desc    Get all mentors
// @route   GET /api/mentors
// @access  Public
const getMentors = asyncHandler(async (req, res) => {
  const {
    specialization,
    expertise,
    minExperience,
    maxRate,
    availability,
    language,
    search,
    page = 1,
    limit = 10,
    sort = 'rating'
  } = req.query;

  // Build filter query
  const filter = { isActive: true, isVerified: true };

  if (specialization) {
    filter.specializations = { $in: specialization.split(',') };
  }

  if (expertise) {
    filter.expertise = { $in: expertise.split(',') };
  }

  if (minExperience) {
    filter.yearsOfExperience = { $gte: Number(minExperience) };
  }

  if (maxRate) {
    filter.rate = { $lte: Number(maxRate) };
  }

  if (language) {
    filter.languages = { $in: language.split(',') };
  }

  if (search) {
    filter.$text = { $search: search };
  }

  if (availability) {
    const [day, startTime, endTime] = availability.split(':');
    
    // Find mentors available on the specified day and time
    filter['availability.day'] = day;
    
    if (startTime && endTime) {
      filter['availability.slots'] = {
        $elemMatch: {
          startTime: { $lte: startTime },
          endTime: { $gte: endTime },
          isBooked: false
        }
      };
    }
  }

  // Set up pagination
  const skip = (Number(page) - 1) * Number(limit);

  // Set up sorting
  let sortOption = {};
  switch (sort) {
    case 'experience':
      sortOption = { yearsOfExperience: -1 };
      break;
    case 'rate-low':
      sortOption = { rate: 1 };
      break;
    case 'rate-high':
      sortOption = { rate: -1 };
      break;
    case 'rating':
    default:
      sortOption = { 'rating.average': -1 };
      break;
  }

  const mentors = await Mentor.find(filter)
    .populate('user', 'name email profileImage')
    .sort(sortOption)
    .skip(skip)
    .limit(Number(limit));

  const total = await Mentor.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: mentors.length,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    },
    data: mentors
  });
});

// @desc    Get mentor by ID
// @route   GET /api/mentors/:id
// @access  Public
const getMentorById = asyncHandler(async (req, res) => {
  const mentor = await Mentor.findById(req.params.id)
    .populate('user', 'name email profileImage')
    .populate('assignedUsers', 'name email profileImage');

  if (!mentor) {
    res.status(404);
    throw new Error('Mentor not found');
  }

  res.status(200).json({
    success: true,
    data: mentor
  });
});

// @desc    Update mentor profile
// @route   PUT /api/mentors/profile
// @access  Private/Mentor
const updateMentorProfile = asyncHandler(async (req, res) => {
  const mentor = await Mentor.findOne({ user: req.user._id });

  if (!mentor) {
    res.status(404);
    throw new Error('Mentor profile not found');
  }

  // Update fields
  const {
    specializations,
    expertise,
    yearsOfExperience,
    bio,
    rate,
    availability,
    education,
    certifications,
    languages,
    isActive
  } = req.body;

  if (specializations) mentor.specializations = specializations;
  if (expertise) mentor.expertise = expertise;
  if (yearsOfExperience) mentor.yearsOfExperience = yearsOfExperience;
  if (bio) mentor.bio = bio;
  if (rate !== undefined) mentor.rate = rate;
  if (availability) mentor.availability = availability;
  if (education) mentor.education = education;
  if (certifications) mentor.certifications = certifications;
  if (languages) mentor.languages = languages;
  if (isActive !== undefined) mentor.isActive = isActive;

  const updatedMentor = await mentor.save();

  res.status(200).json({
    success: true,
    data: updatedMentor
  });
});

// @desc    Get mentor dashboard data (upcoming sessions, assigned users, etc.)
// @route   GET /api/mentors/dashboard
// @access  Private/Mentor
const getMentorDashboard = asyncHandler(async (req, res) => {
  const mentor = await Mentor.findOne({ user: req.user._id });

  if (!mentor) {
    res.status(404);
    throw new Error('Mentor profile not found');
  }

  // Get upcoming sessions
  const today = new Date();
  const upcomingSessions = await Session.find({
    mentor: mentor._id,
    scheduledDate: { $gte: today },
    status: 'scheduled'
  })
    .populate('user', 'name email profileImage')
    .sort('scheduledDate')
    .limit(5);

  // Get recent feedback
  const recentFeedback = await Feedback.find({
    mentor: mentor._id
  })
    .populate('user', 'name email profileImage')
    .sort('-createdAt')
    .limit(5);

  // Get assigned users
  const assignedUsers = await User.find({
    _id: { $in: mentor.assignedUsers }
  })
    .select('name email profileImage');

  // Get session statistics
  const completedSessions = await Session.countDocuments({
    mentor: mentor._id,
    status: 'completed'
  });

  const upcomingSessionsCount = await Session.countDocuments({
    mentor: mentor._id,
    scheduledDate: { $gte: today },
    status: 'scheduled'
  });

  const cancelledSessions = await Session.countDocuments({
    mentor: mentor._id,
    status: 'cancelled'
  });

  // Get feedback statistics
  const totalFeedbackCount = await Feedback.countDocuments({
    mentor: mentor._id
  });

  // Get pending feedback requests (sessions completed but feedback not provided)
  const pendingFeedback = await Session.countDocuments({
    mentor: mentor._id,
    status: 'completed',
    'feedback.mentor.comment': { $exists: false }
  });

  res.status(200).json({
    success: true,
    data: {
      mentor,
      upcomingSessions,
      recentFeedback,
      assignedUsers,
      stats: {
        completedSessions,
        upcomingSessions: upcomingSessionsCount,
        cancelledSessions,
        totalFeedback: totalFeedbackCount,
        pendingFeedback
      }
    }
  });
});

// @desc    Get assigned users
// @route   GET /api/mentors/assigned-users
// @access  Private/Mentor
const getAssignedUsers = asyncHandler(async (req, res) => {
  const mentor = await Mentor.findOne({ user: req.user._id });

  if (!mentor) {
    res.status(404);
    throw new Error('Mentor profile not found');
  }

  // Get detailed user information
  const users = await User.find({
    _id: { $in: mentor.assignedUsers }
  })
    .select('-password');

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// @desc    Get user by ID with relevant data for mentor
// @route   GET /api/mentors/users/:userId
// @access  Private/Mentor
const getUserForMentor = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const mentor = await Mentor.findOne({ user: req.user._id });

  if (!mentor) {
    res.status(404);
    throw new Error('Mentor profile not found');
  }

  // Check if user is assigned to this mentor
  if (!mentor.assignedUsers.includes(userId)) {
    res.status(403);
    throw new Error('This user is not assigned to you');
  }

  // Get user data
  const user = await User.findById(userId).select('-password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Get session history
  const sessions = await Session.find({
    mentor: mentor._id,
    user: userId
  }).sort('-scheduledDate');

  // Get feedback history
  const feedback = await Feedback.find({
    mentor: mentor._id,
    user: userId
  }).sort('-createdAt');

  // Get assessment results
  const assessmentResults = await mongoose.model('Assessment').find({
    user: userId
  }).sort('-completedAt');

  res.status(200).json({
    success: true,
    data: {
      user,
      sessions,
      feedback,
      assessmentResults
    }
  });
});

module.exports = {
  registerAsMentor,
  getMentors,
  getMentorById,
  updateMentorProfile,
  getMentorDashboard,
  getAssignedUsers,
  getUserForMentor
}; 