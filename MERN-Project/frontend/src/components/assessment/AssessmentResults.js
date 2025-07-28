import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import './Assessment.css';

const categoryDescriptions = {
  technical: "You show strong technical aptitude. Consider roles that involve working with technology, systems, and hands-on problem-solving.",
  creative: "You demonstrate creative strengths. Consider roles that allow you to express innovation, design thinking, and artistic abilities.",
  analytical: "You excel in analytical thinking. Consider roles that involve data analysis, research, and logical problem-solving.",
  managerial: "You have leadership potential. Consider roles that involve managing teams, projects, and organizational initiatives.",
  entrepreneurial: "You show entrepreneurial spirit. Consider roles that involve business development, innovation, and taking initiative."
};

const getCategoryClass = (category) => {
  switch(category) {
    case 'technical': return 'tech-fill';
    case 'creative': return 'creative-fill';
    case 'analytical': return 'analytical-fill';
    case 'managerial': return 'managerial-fill';
    case 'entrepreneurial': return 'entrepreneurial-fill';
    default: return '';
  }
};

const formatCategoryName = (name) => {
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const AssessmentResults = () => {
  const { getLatestAssessment } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Use categories from location state if available, otherwise fetch from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if we have categories from the navigation state
        if (location.state?.categories) {
          setCategories(location.state.categories);
          setLoading(false);
        } else {
          // If not, fetch the latest assessment
          const latestAssessment = await getLatestAssessment();
          
          if (latestAssessment) {
            setCategories(latestAssessment.categories);
          } else {
            // No assessment found, redirect to take one
            navigate('/assessment');
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching assessment data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [location.state, getLatestAssessment, navigate]);
  
  if (loading) {
    return (
      <div className="assessment-container">
        <div className="assessment-card">
          <p>Loading assessment results...</p>
        </div>
      </div>
    );
  }
  
  if (!categories) {
    return (
      <div className="assessment-container">
        <div className="assessment-card">
          <h2>No Assessment Results</h2>
          <p>You haven't completed an assessment yet.</p>
          <Link to="/assessment" className="action-button primary-button">
            Take Assessment
          </Link>
        </div>
      </div>
    );
  }
  
  // Find dominant categories (top 2)
  const sortedCategories = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([name]) => name);
  
  return (
    <div className="assessment-container">
      <div className="assessment-header">
        <h1>Assessment Results</h1>
        <Link to="/dashboard" className="back-button">
          Back to Dashboard
        </Link>
      </div>
      
      <div className="assessment-card">
        <div className="assessment-intro">
          <h2>Your Career Profile</h2>
          <p>
            Based on your responses, here's a breakdown of your career strengths and preferences.
            These insights can help guide your career decisions and professional development.
          </p>
        </div>
        
        <div className="results-container">
          <h3 className="results-title">Your Strengths by Category</h3>
          
          <div className="category-grid">
            {Object.entries(categories).map(([category, score]) => (
              <div key={category} className="category-card">
                <h4 className="category-name">{formatCategoryName(category)}</h4>
                <span className="category-percentage">{score}%</span>
                <div className="category-bar">
                  <div 
                    className={`category-fill ${getCategoryClass(category)}`} 
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
                <p className="category-description">
                  {categoryDescriptions[category]}
                </p>
              </div>
            ))}
          </div>
          
          <div className="results-summary">
            <h3>Your Primary Career Direction</h3>
            <p>
              Your assessment shows you have particular strengths in 
              <strong> {formatCategoryName(sortedCategories[0])}</strong> and 
              <strong> {formatCategoryName(sortedCategories[1])}</strong> areas.
              Consider career paths that combine these strengths for maximum satisfaction and success.
            </p>
          </div>
          
          <div className="action-buttons">
            <Link to="/assessment" className="action-button secondary-button">
              Retake Assessment
            </Link>
            <Link to="/profile" className="action-button primary-button">
              Update Profile
            </Link>
            <Link to="/recommendations" className="action-button recommendation-button">
              View Career Recommendations
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentResults; 