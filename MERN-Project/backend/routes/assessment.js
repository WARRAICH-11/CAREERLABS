const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const { validateBody } = require('../middleware/validateMiddleware');

// Validation schema for assessment submission
const assessmentSchema = {
  required: ['answers'],
  properties: {
    answers: {
      type: 'array',
      items: {
        type: 'object',
        required: ['questionId', 'answer'],
        properties: {
          questionId: { type: 'string' },
          answer: { type: ['string', 'number', 'array'] }
        }
      }
    }
  }
};

// Helper function to calculate career categories based on assessment answers
const calculateCareerCategories = (answers) => {
  // Initialize category scores
  const categories = {
    technical: 0,
    creative: 0,
    analytical: 0,
    managerial: 0,
    entrepreneurial: 0
  };
  
  // Map question IDs to categories and their weights
  const questionMapping = {
    'q1': { category: 'technical', weight: 1 },
    'q2': { category: 'creative', weight: 1 },
    'q3': { category: 'analytical', weight: 1 },
    'q4': { category: 'managerial', weight: 1 },
    'q5': { category: 'entrepreneurial', weight: 1 },
    'q6': { category: 'technical', weight: 1 },
    'q7': { category: 'creative', weight: 1 },
    'q8': { category: 'analytical', weight: 1 },
    'q9': { category: 'managerial', weight: 1 },
    'q10': { category: 'entrepreneurial', weight: 1 },
    'q11': { categories: ['technical', 'analytical'], weight: 0.5 },
    'q12': { categories: ['creative', 'entrepreneurial'], weight: 0.5 },
    'q13': { categories: ['managerial', 'entrepreneurial'], weight: 0.5 },
    'q14': { categories: ['technical', 'creative'], weight: 0.5 },
    'q15': { categories: ['analytical', 'managerial'], weight: 0.5 }
  };

  // Calculate scores based on answers
  answers.forEach(item => {
    const mapping = questionMapping[item.questionId];
    if (!mapping) return;
    
    const value = typeof item.answer === 'number' 
      ? item.answer 
      : (Array.isArray(item.answer) ? item.answer.length : 1);
    
    if (mapping.category) {
      categories[mapping.category] += value * mapping.weight;
    } else if (mapping.categories) {
      mapping.categories.forEach(category => {
        categories[category] += value * mapping.weight;
      });
    }
  });
  
  // Normalize scores to percentages
  const total = Object.values(categories).reduce((sum, val) => sum + val, 0);
  const normalizedCategories = {};
  
  Object.keys(categories).forEach(key => {
    normalizedCategories[key] = Math.round((categories[key] / total) * 100);
  });
  
  return normalizedCategories;
};

// @route   POST /api/assessment
// @desc    Submit career assessment
// @access  Private
router.post(
  '/',
  protect,
  validateBody(assessmentSchema),
  asyncHandler(async (req, res) => {
    const { answers } = req.body;
    
    // Calculate career categories based on assessment
    const careerCategories = calculateCareerCategories(answers);
    
    // Save assessment to user profile
    const user = await User.findById(req.user.id);
    
    // Create the assessment object
    const newAssessment = {
      answers,
      categories: careerCategories,
      date: new Date()
    };
    
    // Update user with assessment
    if (!user.assessments) {
      user.assessments = [];
    }
    
    user.assessments.push(newAssessment);
    await user.save();
    
    res.status(201).json({
      success: true,
      data: {
        assessmentId: user.assessments[user.assessments.length - 1]._id,
        categories: careerCategories
      }
    });
  })
);

// @route   GET /api/assessment
// @desc    Get user's assessment history
// @access  Private
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    
    if (!user.assessments || user.assessments.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    res.status(200).json({
      success: true,
      data: user.assessments
    });
  })
);

// @route   GET /api/assessment/latest
// @desc    Get user's latest assessment
// @access  Private
router.get(
  '/latest',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    
    if (!user.assessments || user.assessments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No assessments found'
      });
    }
    
    const latestAssessment = user.assessments[user.assessments.length - 1];
    
    res.status(200).json({
      success: true,
      data: latestAssessment
    });
  })
);

module.exports = router; 