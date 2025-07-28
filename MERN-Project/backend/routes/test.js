const express = require('express');
const router = express.Router();
const Test = require('../models/Test');
const asyncHandler = require('../utils/asyncHandler');

// @route   GET /api/test
// @desc    Get a test message and verify DB connection
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  // Create a test document
  const testItem = new Test({
    name: 'Database Connection Test'
  });
  
  // Save to DB
  await testItem.save();
  
  // Fetch the most recent entry
  const items = await Test.find().sort({ date: -1 }).limit(1);
  
  res.json({
    message: 'MongoDB connection successful!',
    testItem: items[0]
  });
}));

module.exports = router; 