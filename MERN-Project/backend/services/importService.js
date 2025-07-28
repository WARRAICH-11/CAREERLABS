const fs = require('fs');
const path = require('path');
const Skill = require('../models/Skill');
const Job = require('../models/Job');
const { 
  readJsonFile, 
  validateSkill, 
  validateJob, 
  normalizeSkill, 
  normalizeJob, 
  removeDuplicates 
} = require('../utils/dataProcessing');

/**
 * Import skills data from a JSON file
 * @param {string} filePath - Path to the skills JSON file
 * @returns {Promise<Object>} - Import results
 */
const importSkills = async (filePath) => {
  try {
    // Read and parse JSON file
    const data = await readJsonFile(filePath);
    
    if (!data || !Array.isArray(data.skills)) {
      throw new Error('Invalid skills data format. Expected an array under "skills" key.');
    }
    
    const skills = data.skills;
    const results = {
      total: skills.length,
      imported: 0,
      skipped: 0,
      errors: [],
      skillMap: {} // Map to track IDs for linking jobs to skills
    };
    
    // Remove duplicates based on name
    const uniqueSkills = removeDuplicates(skills, 'name');
    
    // Validation and import
    for (const skill of uniqueSkills) {
      try {
        // Validate skill data
        const validation = validateSkill(skill);
        if (!validation.isValid) {
          results.errors.push({ 
            skill: skill.name || 'Unknown', 
            errors: validation.errors 
          });
          results.skipped++;
          continue;
        }
        
        // Normalize skill data
        const normalizedSkill = normalizeSkill(skill);
        
        // Check if skill already exists in database
        let skillDoc = await Skill.findOne({ name: normalizedSkill.name });
        
        if (skillDoc) {
          // Update existing skill
          Object.assign(skillDoc, normalizedSkill);
          await skillDoc.save();
        } else {
          // Create new skill
          skillDoc = await Skill.create(normalizedSkill);
        }
        
        // Store skill ID for linking jobs to skills
        results.skillMap[normalizedSkill.name.toLowerCase()] = skillDoc._id;
        results.imported++;
      } catch (error) {
        results.errors.push({ 
          skill: skill.name || 'Unknown', 
          error: error.message 
        });
        results.skipped++;
      }
    }
    
    return results;
  } catch (error) {
    throw new Error(`Failed to import skills: ${error.message}`);
  }
};

/**
 * Import jobs data from a JSON file
 * @param {string} filePath - Path to the jobs JSON file
 * @param {Object} skillMap - Map of skill names to their IDs
 * @returns {Promise<Object>} - Import results
 */
const importJobs = async (filePath, skillMap) => {
  try {
    // Read and parse JSON file
    const data = await readJsonFile(filePath);
    
    if (!data || !Array.isArray(data.jobs)) {
      throw new Error('Invalid jobs data format. Expected an array under "jobs" key.');
    }
    
    const jobs = data.jobs;
    const results = {
      total: jobs.length,
      imported: 0,
      skipped: 0,
      errors: []
    };
    
    // Remove duplicates based on title and company
    const uniqueJobs = removeDuplicates(jobs, 'title');
    
    // Validation and import
    for (const job of uniqueJobs) {
      try {
        // Validate job data
        const validation = validateJob(job);
        if (!validation.isValid) {
          results.errors.push({ 
            job: job.title || 'Unknown', 
            errors: validation.errors 
          });
          results.skipped++;
          continue;
        }
        
        // Normalize job data
        const normalizedJob = normalizeJob(job);
        
        // Link skills to their IDs
        if (normalizedJob.skills && normalizedJob.skills.length > 0) {
          const skillIds = [];
          for (const skillName of normalizedJob.skills) {
            const skillNameLower = (typeof skillName === 'string' ? skillName : skillName.name).toLowerCase();
            if (skillMap[skillNameLower]) {
              skillIds.push(skillMap[skillNameLower]);
            } else {
              // Skill not found in our import, try to find it in the database
              const skill = await Skill.findOne({ name: new RegExp(`^${skillNameLower}$`, 'i') });
              if (skill) {
                skillIds.push(skill._id);
              }
            }
          }
          normalizedJob.skills = skillIds;
        }
        
        // Check if job already exists in database
        let jobDoc = await Job.findOne({ 
          title: normalizedJob.title,
          company: normalizedJob.company
        });
        
        if (jobDoc) {
          // Update existing job
          Object.assign(jobDoc, normalizedJob);
          await jobDoc.save();
        } else {
          // Create new job
          jobDoc = await Job.create(normalizedJob);
        }
        
        results.imported++;
      } catch (error) {
        results.errors.push({ 
          job: job.title || 'Unknown', 
          error: error.message 
        });
        results.skipped++;
      }
    }
    
    return results;
  } catch (error) {
    throw new Error(`Failed to import jobs: ${error.message}`);
  }
};

/**
 * Perform a complete import of skills and jobs
 * @param {string} skillsFilePath - Path to skills JSON file
 * @param {string} jobsFilePath - Path to jobs JSON file
 * @returns {Promise<Object>} - Import results
 */
const importData = async (skillsFilePath, jobsFilePath) => {
  let skillsResults;
  let jobsResults;
  
  try {
    // First import skills
    skillsResults = await importSkills(skillsFilePath);
    
    // Then import jobs using the skill map from skills import
    jobsResults = await importJobs(jobsFilePath, skillsResults.skillMap);
    
    return {
      skills: skillsResults,
      jobs: jobsResults,
      success: true,
      timestamp: new Date()
    };
  } catch (error) {
    return {
      skills: skillsResults || { imported: 0, skipped: 0, errors: [] },
      jobs: jobsResults || { imported: 0, skipped: 0, errors: [] },
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
};

/**
 * Import data from a directory
 * @param {string} directoryPath - Path to directory containing skills.json and jobs.json
 * @returns {Promise<Object>} - Import results
 */
const importDataFromDirectory = async (directoryPath) => {
  const skillsPath = path.join(directoryPath, 'skills.json');
  const jobsPath = path.join(directoryPath, 'jobs.json');
  
  // Check if files exist
  if (!fs.existsSync(skillsPath)) {
    throw new Error(`Skills file not found at ${skillsPath}`);
  }
  
  if (!fs.existsSync(jobsPath)) {
    throw new Error(`Jobs file not found at ${jobsPath}`);
  }
  
  return importData(skillsPath, jobsPath);
};

module.exports = {
  importSkills,
  importJobs,
  importData,
  importDataFromDirectory
}; 