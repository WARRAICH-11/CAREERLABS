const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const { generateRecommendations } = require('../services/recommendationService');

/**
 * @route   GET /api/recommendation
 * @desc    Get personalized career recommendations for the current user
 * @access  Private
 */
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const recommendations = await generateRecommendations(userId);
    
    res.status(200).json({
      success: true,
      data: recommendations
    });
  })
);

/**
 * @route   GET /api/recommendation/:jobId
 * @desc    Get career path recommendations for a specific job
 * @access  Private
 */
router.get(
  '/:jobId',
  protect,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const jobId = req.params.jobId;
    
    // This will reuse most of the logic from generateRecommendations
    // but focus on a specific job for the career path
    const recommendations = await generateRecommendations(userId, jobId);
    
    res.status(200).json({
      success: true,
      data: recommendations
    });
  })
);

module.exports = router; 