import React from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaMapMarkerAlt, FaBriefcase, FaDollarSign } from 'react-icons/fa';
import './Jobs.css';

const JobCard = ({ job, onSave }) => {
  const {
    _id,
    title,
    company,
    location,
    jobType,
    salary,
    remote,
    description,
    createdAt,
    isSaved,
    isApplied,
    skills
  } = job;
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)} weeks ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Format salary
  const formatSalary = (salaryObj) => {
    if (!salaryObj || (!salaryObj.min && !salaryObj.max)) {
      return 'Salary not specified';
    }
    
    const currency = salaryObj.currency || 'USD';
    const period = salaryObj.period || 'annual';
    
    let formattedAmount = '';
    
    if (salaryObj.min && salaryObj.max) {
      formattedAmount = `${formatCurrency(salaryObj.min, currency)} - ${formatCurrency(salaryObj.max, currency)}`;
    } else if (salaryObj.min) {
      formattedAmount = `${formatCurrency(salaryObj.min, currency)}+`;
    } else if (salaryObj.max) {
      formattedAmount = `Up to ${formatCurrency(salaryObj.max, currency)}`;
    }
    
    // Add period
    switch (period) {
      case 'hourly':
        formattedAmount += ' / hour';
        break;
      case 'monthly':
        formattedAmount += ' / month';
        break;
      case 'annual':
        formattedAmount += ' / year';
        break;
      default:
        break;
    }
    
    return formattedAmount;
  };
  
  // Helper to format currency
  const formatCurrency = (amount, currency) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    });
    
    return formatter.format(amount);
  };
  
  // Format job type
  const formatJobType = (type) => {
    if (!type) return '';
    
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  // Format location
  const formatLocation = (locationObj, isRemote) => {
    if (isRemote) {
      return 'Remote';
    }
    
    if (!locationObj) return 'Location not specified';
    
    if (typeof locationObj === 'string') return locationObj;
    
    const { city, state, country } = locationObj;
    
    if (city && state && country) {
      return `${city}, ${state}, ${country}`;
    } else if (city && state) {
      return `${city}, ${state}`;
    } else if (city && country) {
      return `${city}, ${country}`;
    } else if (city) {
      return city;
    } else if (state && country) {
      return `${state}, ${country}`;
    } else if (state) {
      return state;
    } else if (country) {
      return country;
    }
    
    return 'Location not specified';
  };

  return (
    <div className="job-card">
      <div className="job-card-header">
        <div className="job-company-logo">
          {company?.logo ? (
            <img src={company.logo} alt={`${company.name} logo`} />
          ) : (
            <div className="company-placeholder">
              {company?.name?.charAt(0) || 'C'}
            </div>
          )}
        </div>
        
        <div className="job-card-title">
          <Link to={`/jobs/${_id}`}>
            <h3>{title}</h3>
          </Link>
          <div className="job-company-name">
            {company?.name || 'Company name not available'}
            {company?.isVerified && (
              <span className="verified-badge" title="Verified Company">✓</span>
            )}
          </div>
        </div>
        
        <button className="save-job-button" onClick={onSave} title={isSaved ? 'Unsave job' : 'Save job'}>
          {isSaved ? <FaHeart className="saved" /> : <FaRegHeart />}
        </button>
      </div>
      
      <div className="job-card-meta">
        <div className="job-meta-item">
          <FaMapMarkerAlt className="job-meta-icon" />
          <span>{formatLocation(location, remote)}</span>
        </div>
        
        {jobType && (
          <div className="job-meta-item">
            <FaBriefcase className="job-meta-icon" />
            <span>{formatJobType(jobType)}</span>
          </div>
        )}
        
        {salary && (
          <div className="job-meta-item">
            <FaDollarSign className="job-meta-icon" />
            <span>{formatSalary(salary)}</span>
          </div>
        )}
      </div>
      
      <div className="job-card-description">
        {job.shortDescription || description?.slice(0, 150)}
        {(!job.shortDescription && description?.length > 150) && '...'}
      </div>
      
      {skills && skills.length > 0 && (
        <div className="job-skills">
          {skills.slice(0, 5).map((skill, index) => (
            <span key={index} className="job-skill-tag">
              {typeof skill === 'object' ? skill.name : skill}
            </span>
          ))}
          {skills.length > 5 && (
            <span className="job-skill-more">+{skills.length - 5} more</span>
          )}
        </div>
      )}
      
      <div className="job-card-footer">
        <div className="job-posted">
          {createdAt && `Posted ${formatDate(createdAt)}`}
        </div>
        
        <div className="job-actions">
          {isApplied ? (
            <span className="job-applied-badge">Applied</span>
          ) : (
            <Link to={`/jobs/${_id}`} className="view-job-button">
              View Job
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobCard; 