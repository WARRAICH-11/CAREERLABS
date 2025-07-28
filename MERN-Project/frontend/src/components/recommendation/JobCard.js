import React from 'react';
import './Recommendation.css';

const JobCard = ({ job, isSelected, onSelect }) => {
  return (
    <div 
      className={`job-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="job-card-header">
        <h3 className="job-title">{job.title}</h3>
        <span className="job-company">{job.company}</span>
      </div>
      
      <div className="job-match">
        <div className="match-bar">
          <div 
            className="match-fill" 
            style={{ width: `${job.matchScore}%` }}
          ></div>
        </div>
        <span className="match-percentage">{job.matchScore}% match</span>
      </div>
      
      <div className="job-card-meta">
        {job.experienceLevel && (
          <span className="job-level">{job.experienceLevel}</span>
        )}
        {job.jobType && (
          <span className="job-type">{job.jobType}</span>
        )}
      </div>
      
      <div className="job-skill-match">
        <span className="skill-match-label">Skills match:</span>
        <span className="skill-match-value">{job.skillMatch}%</span>
      </div>
    </div>
  );
};

export default JobCard; 