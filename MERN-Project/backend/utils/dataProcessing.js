const fs = require('fs');
const path = require('path');

/**
 * Read and parse a JSON file
 * @param {string} filePath - Path to the JSON file
 * @returns {Promise<Object>} - Parsed JSON data
 */
const readJsonFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        return reject(err);
      }
      
      try {
        const jsonData = JSON.parse(data);
        resolve(jsonData);
      } catch (parseError) {
        reject(new Error(`Invalid JSON format: ${parseError.message}`));
      }
    });
  });
};

/**
 * Validate skill data
 * @param {Object} skill - Skill data to validate
 * @returns {Object} - Validation result with isValid flag and errors
 */
const validateSkill = (skill) => {
  const errors = [];
  
  // Check required fields
  if (!skill.name) {
    errors.push('Skill name is required');
  }
  
  // Validate skill level if provided
  if (skill.level && !['beginner', 'intermediate', 'advanced', 'expert'].includes(skill.level.toLowerCase())) {
    errors.push(`Invalid skill level: ${skill.level}. Expected: beginner, intermediate, advanced, or expert`);
  }
  
  // Check if keywords is an array
  if (skill.keywords && !Array.isArray(skill.keywords)) {
    errors.push('Keywords should be an array');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate job data
 * @param {Object} job - Job data to validate
 * @returns {Object} - Validation result with isValid flag and errors
 */
const validateJob = (job) => {
  const errors = [];
  
  // Check required fields
  if (!job.title) {
    errors.push('Job title is required');
  }
  
  // Validate experience level if provided
  if (job.experienceLevel && !['entry', 'junior', 'mid', 'senior', 'executive'].includes(job.experienceLevel.toLowerCase())) {
    errors.push(`Invalid experience level: ${job.experienceLevel}. Expected: entry, junior, mid, senior, or executive`);
  }
  
  // Validate job type if provided
  if (job.jobType && !['full-time', 'part-time', 'contract', 'internship', 'freelance'].includes(job.jobType.toLowerCase())) {
    errors.push(`Invalid job type: ${job.jobType}. Expected: full-time, part-time, contract, internship, or freelance`);
  }
  
  // Check if skills is an array
  if (job.skills && !Array.isArray(job.skills)) {
    errors.push('Skills should be an array');
  }
  
  // Check if education requirements is an array
  if (job.educationRequirements && !Array.isArray(job.educationRequirements)) {
    errors.push('Education requirements should be an array');
  }
  
  // Validate salary if provided
  if (job.salary) {
    if (typeof job.salary !== 'object') {
      errors.push('Salary should be an object');
    } else {
      if (job.salary.min && typeof job.salary.min !== 'number') {
        errors.push('Salary minimum should be a number');
      }
      if (job.salary.max && typeof job.salary.max !== 'number') {
        errors.push('Salary maximum should be a number');
      }
      if (job.salary.min && job.salary.max && job.salary.min > job.salary.max) {
        errors.push('Salary minimum should not be greater than maximum');
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Normalize skill data (clean up, convert formats, etc.)
 * @param {Object} skill - Skill data to normalize
 * @returns {Object} - Normalized skill data
 */
const normalizeSkill = (skill) => {
  const normalized = { ...skill };
  
  // Trim text fields
  if (normalized.name) normalized.name = normalized.name.trim();
  if (normalized.category) normalized.category = normalized.category.trim();
  if (normalized.description) normalized.description = normalized.description.trim();
  
  // Ensure keywords is an array and remove duplicates
  if (normalized.keywords) {
    if (!Array.isArray(normalized.keywords)) {
      normalized.keywords = [normalized.keywords];
    }
    // Trim each keyword and remove duplicates
    normalized.keywords = [...new Set(normalized.keywords.map(k => k.trim()))];
  } else {
    normalized.keywords = [];
  }
  
  // Normalize level to lowercase
  if (normalized.level) {
    normalized.level = normalized.level.toLowerCase();
  } else {
    normalized.level = 'intermediate';
  }
  
  return normalized;
};

/**
 * Normalize job data (clean up, convert formats, etc.)
 * @param {Object} job - Job data to normalize
 * @returns {Object} - Normalized job data
 */
const normalizeJob = (job) => {
  const normalized = { ...job };
  
  // Trim text fields
  if (normalized.title) normalized.title = normalized.title.trim();
  if (normalized.description) normalized.description = normalized.description.trim();
  if (normalized.category) normalized.category = normalized.category.trim();
  if (normalized.industry) normalized.industry = normalized.industry.trim();
  if (normalized.location) normalized.location = normalized.location.trim();
  if (normalized.company) normalized.company = normalized.company.trim();
  
  // Ensure skills is an array and remove duplicates (assuming skills are strings here)
  if (normalized.skills) {
    if (!Array.isArray(normalized.skills)) {
      normalized.skills = [normalized.skills];
    }
    // If skills are strings, trim them
    normalized.skills = normalized.skills.map(s => 
      typeof s === 'string' ? s.trim() : s
    );
  } else {
    normalized.skills = [];
  }
  
  // Ensure education requirements is an array
  if (normalized.educationRequirements) {
    if (!Array.isArray(normalized.educationRequirements)) {
      normalized.educationRequirements = [normalized.educationRequirements];
    }
    // Trim each requirement
    normalized.educationRequirements = normalized.educationRequirements.map(er => er.trim());
  } else {
    normalized.educationRequirements = [];
  }
  
  // Normalize experience level to lowercase
  if (normalized.experienceLevel) {
    normalized.experienceLevel = normalized.experienceLevel.toLowerCase();
  }
  
  // Normalize job type to lowercase
  if (normalized.jobType) {
    normalized.jobType = normalized.jobType.toLowerCase();
  }
  
  // Ensure remote is a boolean
  if (normalized.remote !== undefined) {
    normalized.remote = Boolean(normalized.remote);
  }
  
  // Ensure salary is properly structured
  if (normalized.salary) {
    if (typeof normalized.salary !== 'object') {
      // Convert to object if it's a primitive
      normalized.salary = { 
        min: Number(normalized.salary),
        max: Number(normalized.salary)
      };
    } else {
      // Ensure min and max are numbers
      if (normalized.salary.min) normalized.salary.min = Number(normalized.salary.min);
      if (normalized.salary.max) normalized.salary.max = Number(normalized.salary.max);
      
      // Ensure currency is uppercase
      if (normalized.salary.currency) {
        normalized.salary.currency = normalized.salary.currency.toUpperCase();
      } else {
        normalized.salary.currency = 'USD';
      }
    }
  }
  
  return normalized;
};

/**
 * Check for and remove duplicate entries based on a key property
 * @param {Array} items - Array of items to check for duplicates
 * @param {string} key - The property to check for uniqueness
 * @returns {Array} - Array with duplicates removed
 */
const removeDuplicates = (items, key) => {
  const uniqueMap = new Map();
  
  items.forEach(item => {
    if (!uniqueMap.has(item[key])) {
      uniqueMap.set(item[key], item);
    }
  });
  
  return Array.from(uniqueMap.values());
};

module.exports = {
  readJsonFile,
  validateSkill,
  validateJob,
  normalizeSkill,
  normalizeJob,
  removeDuplicates
}; 