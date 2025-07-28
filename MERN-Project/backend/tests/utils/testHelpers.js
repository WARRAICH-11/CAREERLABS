/**
 * Test Helpers
 * 
 * Utility functions to assist with testing, including creating test users,
 * generating JWT tokens, and setting up test data.
 */

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Mentor = require('../../models/Mentor');
const Job = require('../../models/Job');
const Notification = require('../../models/Notification');

/**
 * Create a test user
 * @param {Object} userData - User data to override defaults
 * @returns {Object} Created user document
 */
const createUser = async (userData = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    role: 'user',
  };

  const mergedData = { ...defaultUser, ...userData };
  return await User.create(mergedData);
};

/**
 * Create a test admin user
 * @returns {Object} Created admin user document
 */
const createAdminUser = async () => {
  return await createUser({ role: 'admin' });
};

/**
 * Create a test mentor user
 * @returns {Object} Created mentor data including user and mentor documents
 */
const createMentor = async () => {
  const user = await createUser({ role: 'mentor' });
  
  const mentor = await Mentor.create({
    user: user._id,
    specialization: 'Career Development',
    bio: 'Professional mentor with 10+ years experience',
    hourlyRate: 50,
    availability: [
      { day: 'Monday', slots: ['09:00-10:00', '14:00-15:00'] },
      { day: 'Wednesday', slots: ['11:00-12:00', '16:00-17:00'] }
    ]
  });
  
  return { user, mentor };
};

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object to generate token for
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'test-jwt-secret',
    { expiresIn: process.env.JWT_EXPIRE || '1h' }
  );
};

/**
 * Create a test job listing
 * @param {Object} jobData - Job data to override defaults
 * @returns {Object} Created job document
 */
const createJob = async (jobData = {}) => {
  const defaultJob = {
    title: 'Test Job Position',
    company: mongoose.Types.ObjectId(),
    location: 'Remote',
    description: 'This is a test job description',
    requirements: ['Requirement 1', 'Requirement 2'],
    salary: { min: 50000, max: 80000, currency: 'USD' },
    employmentType: 'Full-time',
    skills: ['JavaScript', 'React', 'Node.js']
  };
  
  const mergedData = { ...defaultJob, ...jobData };
  return await Job.create(mergedData);
};

/**
 * Create a test notification
 * @param {Object} notificationData - Notification data to override defaults
 * @returns {Object} Created notification document
 */
const createNotification = async (notificationData = {}) => {
  // Create recipient if not provided
  let recipient = notificationData.recipient;
  if (!recipient) {
    const user = await createUser();
    recipient = user._id;
  }
  
  const defaultNotification = {
    recipient,
    type: 'system',
    title: 'Test Notification',
    content: { message: 'This is a test notification' },
    read: false
  };
  
  const mergedData = { ...defaultNotification, ...notificationData };
  return await Notification.create(mergedData);
};

/**
 * Clear all test data from the database
 */
const clearDatabase = async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Cannot clear database outside of test environment');
  }
  
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

module.exports = {
  createUser,
  createAdminUser,
  createMentor,
  generateToken,
  createJob,
  createNotification,
  clearDatabase
}; 