import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { currentUser, logout, getLatestAssessment } = useContext(AuthContext);
  const [latestAssessment, setLatestAssessment] = useState(null);
  
  useEffect(() => {
    const fetchLatestAssessment = async () => {
      try {
        const assessment = await getLatestAssessment();
        setLatestAssessment(assessment);
      } catch (error) {
        console.error('Error fetching assessment:', error);
      }
    };
    
    fetchLatestAssessment();
  }, [getLatestAssessment]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
      
      <div className="dashboard-content">
        <div className="user-profile">
          <h2>Welcome, {currentUser?.name || 'User'}!</h2>
          <div className="profile-details">
            <p><strong>Email:</strong> {currentUser?.email}</p>
            <p><strong>Role:</strong> {currentUser?.role}</p>
            <p><strong>Joined:</strong> {new Date(currentUser?.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <h3>Profile</h3>
            <p>View and update your profile information.</p>
            <Link to="/profile" className="dashboard-button">View Profile</Link>
          </div>
          
          <div className="dashboard-card">
            <h3>Career Assessment</h3>
            <p>
              {latestAssessment 
                ? 'Review your career assessment results or take a new assessment.' 
                : 'Take a career assessment to discover your strengths and career paths.'}
            </p>
            {latestAssessment ? (
              <div>
                <Link to="/assessment/results" className="dashboard-button">View Results</Link>
                <Link to="/assessment" className="dashboard-button">New Assessment</Link>
              </div>
            ) : (
              <Link to="/assessment" className="dashboard-button">Take Assessment</Link>
            )}
          </div>
          
          <div className="dashboard-card">
            <h3>Career Recommendations</h3>
            <p>Get personalized career recommendations based on your profile and assessment results.</p>
            <Link to="/recommendations" className="dashboard-button">View Recommendations</Link>
          </div>
          
          <div className="dashboard-card">
            <h3>Your Activity</h3>
            <p>View your recent activity and interactions.</p>
            <button className="dashboard-button">View Activity</button>
          </div>
          
          <div className="dashboard-card">
            <h3>Settings</h3>
            <p>Configure your preferences and notifications.</p>
            <button className="dashboard-button">Adjust Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 