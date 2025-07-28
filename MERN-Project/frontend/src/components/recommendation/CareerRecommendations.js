import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import './Recommendation.css';

// Components
import JobCard from './JobCard';
import SkillRecommendation from './SkillRecommendation';
import CareerPath from './CareerPath';
import Loader from '../common/Loader';

const CareerRecommendations = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeTab, setActiveTab] = useState('jobs');
  
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/recommendation`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (res.data.success) {
          setRecommendations(res.data.data);
          // Select the first job by default if available
          if (res.data.data.recommendedJobs && res.data.data.recommendedJobs.length > 0) {
            setSelectedJob(res.data.data.recommendedJobs[0]);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch recommendations');
        console.error('Error fetching recommendations:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecommendations();
  }, []);
  
  const handleJobSelect = (job) => {
    setSelectedJob(job);
  };
  
  const renderAssessmentProfile = () => {
    if (!recommendations || !recommendations.assessmentProfile) return null;
    
    const { assessmentProfile } = recommendations;
    const categories = [
      { name: 'Technical', value: assessmentProfile.technical },
      { name: 'Creative', value: assessmentProfile.creative },
      { name: 'Analytical', value: assessmentProfile.analytical },
      { name: 'Managerial', value: assessmentProfile.managerial },
      { name: 'Entrepreneurial', value: assessmentProfile.entrepreneurial }
    ];
    
    return (
      <div className="assessment-profile">
        <h3>Your Career Profile</h3>
        <div className="profile-categories">
          {categories.map((category) => (
            <div key={category.name} className="category">
              <div className="category-name">{category.name}</div>
              <div className="category-bar">
                <div 
                  className="category-fill" 
                  style={{ width: `${category.value}%` }}
                ></div>
              </div>
              <div className="category-value">{category.value}%</div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  if (loading) {
    return <Loader message="Generating your personalized career recommendations..." />;
  }
  
  if (error) {
    return (
      <div className="recommendation-error">
        <h2>Error Loading Recommendations</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/dashboard')}>
          Return to Dashboard
        </button>
      </div>
    );
  }
  
  if (!recommendations) {
    return (
      <div className="recommendation-error">
        <h2>No Recommendations Available</h2>
        <p>We don't have enough data to generate personalized recommendations yet.</p>
        <button onClick={() => navigate('/assessment')}>
          Take Career Assessment
        </button>
      </div>
    );
  }
  
  return (
    <div className="recommendations-container">
      <div className="recommendations-header">
        <h1>Your Career Recommendations</h1>
        <p>Based on your profile, assessment results, and skills</p>
      </div>
      
      {renderAssessmentProfile()}
      
      <div className="recommendations-tabs">
        <button 
          className={`tab-button ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          Recommended Jobs
        </button>
        <button 
          className={`tab-button ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          Skills to Develop
        </button>
        <button 
          className={`tab-button ${activeTab === 'path' ? 'active' : ''}`}
          onClick={() => setActiveTab('path')}
        >
          Career Path
        </button>
      </div>
      
      <div className="recommendations-content">
        {activeTab === 'jobs' && (
          <div className="jobs-section">
            <div className="jobs-list">
              {recommendations.recommendedJobs.map((job) => (
                <JobCard 
                  key={job.id} 
                  job={job} 
                  isSelected={selectedJob && selectedJob.id === job.id}
                  onSelect={() => handleJobSelect(job)}
                />
              ))}
            </div>
            
            {selectedJob && (
              <div className="job-details">
                <h3>{selectedJob.title}</h3>
                <p className="job-company">{selectedJob.company}</p>
                <div className="match-score">
                  <span className="score-label">Match Score:</span>
                  <span className="score-value">{selectedJob.matchScore}%</span>
                </div>
                <div className="job-meta">
                  <span className="job-type">{selectedJob.jobType}</span>
                  <span className="experience-level">{selectedJob.experienceLevel}</span>
                  {selectedJob.salary && (
                    <span className="salary">
                      {selectedJob.salary.min && selectedJob.salary.max 
                        ? `$${selectedJob.salary.min.toLocaleString()} - $${selectedJob.salary.max.toLocaleString()}`
                        : 'Salary not specified'}
                    </span>
                  )}
                </div>
                <div className="job-description">
                  <h4>Description</h4>
                  <p>{selectedJob.description}</p>
                </div>
                <div className="action-buttons">
                  <button 
                    className="view-path-button"
                    onClick={() => setActiveTab('path')}
                  >
                    View Career Path
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'skills' && (
          <SkillRecommendation skills={recommendations.skillRecommendations} />
        )}
        
        {activeTab === 'path' && (
          <CareerPath 
            careerPath={recommendations.careerPath} 
            selectedJob={selectedJob} 
          />
        )}
      </div>
    </div>
  );
};

export default CareerRecommendations; 