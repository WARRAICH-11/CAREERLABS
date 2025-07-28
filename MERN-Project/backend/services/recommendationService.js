const User = require('../models/User');
const Job = require('../models/Job');
const Skill = require('../models/Skill');
const kmeans = require('node-kmeans');
const natural = require('natural');
const similarity = require('cosine-similarity');

// TF-IDF for text analysis
const TfIdf = natural.TfIdf;

/**
 * Generate vector representation of user profile based on assessment results and skills
 * @param {Object} user - User document from MongoDB
 * @returns {Object} - User feature vector
 */
const generateUserVector = async (user) => {
  // Default vector if no assessment found
  let vector = {
    technical: 20,
    creative: 20,
    analytical: 20,
    managerial: 20,
    entrepreneurial: 20,
    skills: []
  };

  // Get latest assessment if available
  if (user.assessments && user.assessments.length > 0) {
    const latestAssessment = user.assessments[user.assessments.length - 1];
    
    vector.technical = latestAssessment.categories.technical || 20;
    vector.creative = latestAssessment.categories.creative || 20;
    vector.analytical = latestAssessment.categories.analytical || 20;
    vector.managerial = latestAssessment.categories.managerial || 20;
    vector.entrepreneurial = latestAssessment.categories.entrepreneurial || 20;
  }

  // Add user skills
  if (user.skills && user.skills.length > 0) {
    vector.skills = user.skills;
  }

  // Add skills inferred from education and experience
  if (user.education) {
    const educationKeywords = user.education.flatMap(edu => 
      [edu.degree, edu.fieldOfStudy].filter(Boolean));
    
    // Find related skills based on education keywords
    const relatedSkills = await Skill.find({
      $or: [
        { name: { $in: educationKeywords } },
        { keywords: { $in: educationKeywords } }
      ]
    }).limit(5);
    
    vector.skills = [...new Set([...vector.skills, ...relatedSkills.map(s => s.name)])];
  }

  return vector;
};

/**
 * Process job data to create feature vectors
 * @param {Array} jobs - Array of job documents
 * @returns {Array} - Array of job vectors
 */
const processJobVectors = (jobs) => {
  return jobs.map(job => {
    // Create a feature vector for each job
    return {
      id: job._id,
      title: job.title,
      vector: {
        // Map job attributes to the same dimensions as user vectors
        technical: getScoreForJobCategory(job, 'technical'),
        creative: getScoreForJobCategory(job, 'creative'),
        analytical: getScoreForJobCategory(job, 'analytical'),
        managerial: getScoreForJobCategory(job, 'managerial'),
        entrepreneurial: getScoreForJobCategory(job, 'entrepreneurial'),
        skills: job.skills.map(s => typeof s === 'object' ? s.name : s)
      },
      description: job.description,
      salary: job.salary,
      company: job.company,
      jobType: job.jobType,
      experienceLevel: job.experienceLevel
    };
  });
};

/**
 * Helper function to score a job for a specific category
 * Uses text analysis on job title and description to infer category score
 */
const getScoreForJobCategory = (job, category) => {
  const categoryKeywords = {
    technical: ['developer', 'engineer', 'programmer', 'technical', 'software', 'IT', 'system', 'data', 'analyst'],
    creative: ['designer', 'creative', 'artist', 'writer', 'content', 'media', 'graphic'],
    analytical: ['analyst', 'research', 'analytics', 'data', 'statistics', 'scientific', 'intelligence'],
    managerial: ['manager', 'director', 'lead', 'supervisor', 'coordinator', 'head'],
    entrepreneurial: ['founder', 'entrepreneur', 'owner', 'startup', 'business', 'venture']
  };

  const text = `${job.title} ${job.description} ${job.industry || ''}`.toLowerCase();
  
  // Count keyword matches
  const keywordCount = categoryKeywords[category].reduce((count, keyword) => {
    return count + (text.includes(keyword.toLowerCase()) ? 1 : 0);
  }, 0);
  
  // Normalize to a score between 0-100
  const normalizedScore = Math.min(100, keywordCount * 20);
  
  return normalizedScore || 10; // Default minimum score of 10
};

/**
 * Find similarity between user vector and job vectors
 * @param {Object} userVector - User feature vector
 * @param {Array} jobVectors - Array of job feature vectors
 * @returns {Array} - Jobs sorted by similarity score
 */
const findSimilarJobs = (userVector, jobVectors) => {
  // Convert vectors to arrays for cosine similarity
  const userArray = [
    userVector.technical, 
    userVector.creative, 
    userVector.analytical, 
    userVector.managerial, 
    userVector.entrepreneurial
  ];
  
  return jobVectors.map(job => {
    const jobArray = [
      job.vector.technical,
      job.vector.creative,
      job.vector.analytical,
      job.vector.managerial,
      job.vector.entrepreneurial
    ];
    
    // Calculate cosine similarity between user and job
    const categorySimilarity = similarity([userArray], [jobArray])[0];
    
    // Calculate skill match percentage
    const skillMatchCount = job.vector.skills.filter(skill => 
      userVector.skills.includes(skill)).length;
    
    const skillMatchScore = job.vector.skills.length > 0 
      ? (skillMatchCount / job.vector.skills.length) * 100
      : 0;
    
    // Combined score (weighted)
    const combinedScore = (categorySimilarity * 0.7) + (skillMatchScore * 0.3);
    
    return {
      ...job,
      similarity: categorySimilarity,
      skillMatchScore,
      combinedScore
    };
  }).sort((a, b) => b.combinedScore - a.combinedScore);
};

/**
 * Generate skill recommendations for a user
 * @param {Object} user - User document
 * @param {Array} recommendedJobs - Recommended jobs
 * @returns {Array} - Recommended skills to learn
 */
const recommendSkills = async (user, recommendedJobs) => {
  // Get current user skills
  const userSkills = user.skills || [];
  
  // Extract skills from recommended jobs
  const jobSkills = recommendedJobs.flatMap(job => 
    job.vector.skills).filter(Boolean);
  
  // Find most common skills in recommended jobs that user doesn't have
  const skillFrequency = {};
  jobSkills.forEach(skill => {
    if (!userSkills.includes(skill)) {
      skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
    }
  });
  
  // Sort skills by frequency
  const recommendedSkills = Object.entries(skillFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, frequency]) => ({ name, frequency }));
  
  // Enrich with skill details from database
  const enrichedSkills = await Promise.all(
    recommendedSkills.map(async (skill) => {
      const skillDoc = await Skill.findOne({ name: skill.name });
      return {
        ...skill,
        category: skillDoc?.category || 'Unknown',
        description: skillDoc?.description || 'No description available',
        level: skillDoc?.level || 'intermediate'
      };
    })
  );
  
  return enrichedSkills;
};

/**
 * Generate career path recommendations based on user profile and target job
 * @param {Object} user - User document
 * @param {Object} targetJob - Target job
 * @returns {Object} - Career path with steps
 */
const generateCareerPath = async (user, targetJob) => {
  // Get user's experience level based on education and work experience
  const userExperienceYears = calculateExperienceYears(user);
  const userExperienceLevel = mapExperienceToLevel(userExperienceYears);
  
  // Target job experience level
  const targetLevel = targetJob.experienceLevel || 'mid';
  
  // If user already has required experience level
  if (compareExperienceLevels(userExperienceLevel, targetLevel) >= 0) {
    return {
      currentLevel: userExperienceLevel,
      targetLevel,
      steps: [{
        title: 'Apply Directly',
        description: 'You already have the experience level required for this position.',
        timeframe: 'Immediate',
        skills: targetJob.vector.skills
      }]
    };
  }
  
  // Otherwise, build a career path
  const levels = ['entry', 'junior', 'mid', 'senior', 'executive'];
  const userLevelIndex = levels.indexOf(userExperienceLevel);
  const targetLevelIndex = levels.indexOf(targetLevel);
  
  // Build intermediate steps
  const steps = [];
  for (let i = userLevelIndex; i < targetLevelIndex; i++) {
    const currentLevel = levels[i];
    const nextLevel = levels[i+1];
    
    // Find intermediate jobs at the next level
    const intermediateJobs = await Job.find({
      experienceLevel: nextLevel,
      skills: { $in: targetJob.vector.skills }
    }).limit(2);
    
    intermediateJobs.forEach(job => {
      steps.push({
        title: job.title,
        description: `Gain experience as a ${job.title} to build skills for your target role.`,
        timeframe: `${i === userLevelIndex ? 'Current' : i-userLevelIndex+1}-${i-userLevelIndex+2} years`,
        skills: job.skills.map(s => typeof s === 'object' ? s.name : s)
      });
    });
  }
  
  // Add target job as final step
  steps.push({
    title: targetJob.title,
    description: 'Target role',
    timeframe: `${targetLevelIndex-userLevelIndex}+ years`,
    skills: targetJob.vector.skills
  });
  
  return {
    currentLevel: userExperienceLevel,
    targetLevel,
    steps
  };
};

/**
 * Helper function to calculate years of experience from user profile
 */
const calculateExperienceYears = (user) => {
  if (!user.experience || user.experience.length === 0) {
    return 0;
  }
  
  let totalYears = 0;
  
  user.experience.forEach(exp => {
    const fromDate = new Date(exp.from);
    const toDate = exp.current ? new Date() : new Date(exp.to);
    
    if (fromDate && toDate) {
      const years = (toDate - fromDate) / (365 * 24 * 60 * 60 * 1000);
      totalYears += years;
    }
  });
  
  return Math.round(totalYears);
};

/**
 * Map years of experience to experience level
 */
const mapExperienceToLevel = (years) => {
  if (years < 1) return 'entry';
  if (years < 3) return 'junior';
  if (years < 6) return 'mid';
  if (years < 10) return 'senior';
  return 'executive';
};

/**
 * Compare experience levels
 * Returns: 1 if a > b, 0 if a = b, -1 if a < b
 */
const compareExperienceLevels = (a, b) => {
  const levels = {
    'entry': 1,
    'junior': 2,
    'mid': 3,
    'senior': 4,
    'executive': 5
  };
  
  return Math.sign(levels[a] - levels[b]);
};

/**
 * Generate career recommendations for a user
 * @param {String} userId - User ID
 * @returns {Object} - Career recommendations
 */
const generateRecommendations = async (userId) => {
  try {
    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Generate user vector
    const userVector = await generateUserVector(user);
    
    // Get jobs data
    const jobs = await Job.find({}).populate('skills');
    
    // Process job vectors
    const jobVectors = processJobVectors(jobs);
    
    // Find similar jobs
    const similarJobs = findSimilarJobs(userVector, jobVectors);
    
    // Get top recommended jobs
    const recommendedJobs = similarJobs.slice(0, 5);
    
    // Generate skill recommendations
    const skillRecommendations = await recommendSkills(user, recommendedJobs);
    
    // Generate career path for top job
    const careerPath = recommendedJobs.length > 0 
      ? await generateCareerPath(user, recommendedJobs[0])
      : null;
    
    return {
      recommendedJobs: recommendedJobs.map(job => ({
        id: job.id,
        title: job.title,
        description: job.description,
        company: job.company,
        matchScore: Math.round(job.combinedScore * 100),
        skillMatch: Math.round(job.skillMatchScore),
        salary: job.salary,
        experienceLevel: job.experienceLevel,
        jobType: job.jobType
      })),
      skillRecommendations,
      careerPath,
      assessmentProfile: {
        technical: userVector.technical,
        creative: userVector.creative,
        analytical: userVector.analytical,
        managerial: userVector.managerial,
        entrepreneurial: userVector.entrepreneurial
      }
    };
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
};

module.exports = {
  generateRecommendations
}; 