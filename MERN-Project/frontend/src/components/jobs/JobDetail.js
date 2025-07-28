import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { BiArrowBack, BiBuilding, BiLocationPlus, BiDollarCircle, BiCalendar, 
  BiTimeFive, BiBookmark, BiBookmarkAlt, BiLinkExternal } from 'react-icons/bi';
import { FaBriefcase, FaGraduationCap, FaUsers } from 'react-icons/fa';
import './Jobs.css';

const JobDetail = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [similarJobs, setSimilarJobs] = useState([]);

  useEffect(() => {
    const fetchJobDetails = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/jobs/${jobId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setJob(response.data);
        
        // Check if job is saved
        const savedJobsResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/jobs/saved`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        setIsSaved(savedJobsResponse.data.some(savedJob => savedJob._id === jobId));
        
        // Fetch similar jobs
        const similarJobsResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/jobs/similar/${jobId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setSimilarJobs(similarJobsResponse.data.slice(0, 3));
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch job details');
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);

  const toggleSaveJob = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (isSaved) {
        await axios.delete(
          `${process.env.REACT_APP_API_URL}/api/jobs/saved/${jobId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      } else {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/jobs/saved/${jobId}`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      }
      
      setIsSaved(!isSaved);
    } catch (err) {
      console.error('Error toggling saved job:', err);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Not specified';
    if (!min) return `Up to $${max.toLocaleString()}`;
    if (!max) return `From $${min.toLocaleString()}`;
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="job-detail-container">
        <p>Loading job details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="job-detail-container">
        <button className="job-back-button" onClick={() => navigate(-1)}>
          <BiArrowBack /> Back to jobs
        </button>
        <p className="error-message">Error: {error}</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="job-detail-container">
        <button className="job-back-button" onClick={() => navigate(-1)}>
          <BiArrowBack /> Back to jobs
        </button>
        <p>Job not found.</p>
      </div>
    );
  }

  return (
    <div className="job-detail-container">
      <button className="job-back-button" onClick={() => navigate(-1)}>
        <BiArrowBack /> Back to jobs
      </button>
      
      <div className="job-detail-header">
        <div className="job-detail-title-section">
          <h1 className="job-detail-title">{job.title}</h1>
          
          <div className="job-detail-company">
            {job.company && job.company.logo ? (
              <img 
                src={job.company.logo} 
                alt={`${job.company.name} logo`} 
                className="job-detail-company-logo" 
              />
            ) : (
              <div className="job-company-default">
                <BiBuilding />
              </div>
            )}
            
            <div className="job-detail-company-info">
              <span className="job-detail-company-name">
                {job.company ? job.company.name : 'Company not specified'}
              </span>
              {job.location && (
                <span className="job-detail-company-location">
                  <BiLocationPlus /> {job.location}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="job-detail-actions">
          <button 
            className={`job-detail-save ${isSaved ? 'saved' : ''}`}
            onClick={toggleSaveJob}
          >
            {isSaved ? <BiBookmarkAlt /> : <BiBookmark />}
            {isSaved ? 'Saved' : 'Save Job'}
          </button>
          
          <Link 
            to={`/jobs/${jobId}/apply`} 
            className="job-detail-apply"
          >
            Apply Now
          </Link>
        </div>
      </div>
      
      <div className="job-detail-highlights">
        {job.jobType && (
          <div className="job-highlight">
            <span className="job-highlight-label">Job Type</span>
            <span className="job-highlight-value">
              <BiTimeFive className="job-highlight-icon" />
              {job.jobType}
            </span>
          </div>
        )}
        
        {(job.salary?.min || job.salary?.max) && (
          <div className="job-highlight">
            <span className="job-highlight-label">Salary Range</span>
            <span className="job-highlight-value">
              <BiDollarCircle className="job-highlight-icon" />
              {formatSalary(job.salary?.min, job.salary?.max)}
            </span>
          </div>
        )}
        
        {job.experience && (
          <div className="job-highlight">
            <span className="job-highlight-label">Experience</span>
            <span className="job-highlight-value">
              <FaBriefcase className="job-highlight-icon" />
              {job.experience}
            </span>
          </div>
        )}
        
        {job.education && (
          <div className="job-highlight">
            <span className="job-highlight-label">Education</span>
            <span className="job-highlight-value">
              <FaGraduationCap className="job-highlight-icon" />
              {job.education}
            </span>
          </div>
        )}
        
        {job.postedDate && (
          <div className="job-highlight">
            <span className="job-highlight-label">Posted Date</span>
            <span className="job-highlight-value">
              <BiCalendar className="job-highlight-icon" />
              {formatDate(job.postedDate)}
            </span>
          </div>
        )}
        
        {job.companySize && (
          <div className="job-highlight">
            <span className="job-highlight-label">Company Size</span>
            <span className="job-highlight-value">
              <FaUsers className="job-highlight-icon" />
              {job.companySize}
            </span>
          </div>
        )}
      </div>
      
      {job.description && (
        <div className="job-detail-section">
          <h2 className="job-detail-section-title">Description</h2>
          <div className="job-detail-description">
            {job.description.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      )}
      
      {job.responsibilities && job.responsibilities.length > 0 && (
        <div className="job-detail-section">
          <h2 className="job-detail-section-title">Responsibilities</h2>
          <ul className="job-detail-list job-detail-responsibilities">
            {job.responsibilities.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      
      {job.requirements && job.requirements.length > 0 && (
        <div className="job-detail-section">
          <h2 className="job-detail-section-title">Requirements</h2>
          <ul className="job-detail-list job-detail-requirements">
            {job.requirements.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      
      {job.benefits && job.benefits.length > 0 && (
        <div className="job-detail-section">
          <h2 className="job-detail-section-title">Benefits</h2>
          <ul className="job-detail-list job-detail-benefits">
            {job.benefits.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      
      {job.applicationUrl && (
        <div className="job-detail-section">
          <h2 className="job-detail-section-title">How to Apply</h2>
          <p>
            You can apply directly through our platform or visit the company website:
            <a 
              href={job.applicationUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="external-link"
            >
              Apply on Company Website <BiLinkExternal />
            </a>
          </p>
        </div>
      )}
      
      {similarJobs.length > 0 && (
        <div className="similar-jobs-section">
          <h2 className="similar-jobs-title">Similar Jobs</h2>
          <div className="similar-jobs-list">
            {similarJobs.map(similarJob => (
              <div key={similarJob._id} className="job-card">
                <div className="job-card-header">
                  {similarJob.company && similarJob.company.logo ? (
                    <img 
                      src={similarJob.company.logo} 
                      alt={`${similarJob.company.name} logo`} 
                      className="job-company-logo" 
                    />
                  ) : (
                    <div className="job-company-default">
                      <BiBuilding />
                    </div>
                  )}
                </div>
                
                <h3 className="job-title">{similarJob.title}</h3>
                
                <p className="job-company">
                  {similarJob.company ? similarJob.company.name : 'Company not specified'}
                </p>
                
                <div className="job-details">
                  {similarJob.location && (
                    <span className="job-detail">
                      <BiLocationPlus className="job-detail-icon" />
                      {similarJob.location}
                    </span>
                  )}
                  
                  {similarJob.jobType && (
                    <span className="job-detail">
                      <BiTimeFive className="job-detail-icon" />
                      {similarJob.jobType}
                    </span>
                  )}
                </div>
                
                <div className="job-footer">
                  <span className="job-date">
                    {formatDate(similarJob.postedDate)}
                  </span>
                  
                  <Link to={`/jobs/${similarJob._id}`} className="job-apply-link">
                    View Job
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetail; 