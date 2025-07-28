import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { currentUser, deleteEducation, deleteExperience } = useContext(AuthContext);
  const [educationToDelete, setEducationToDelete] = useState(null);
  const [experienceToDelete, setExperienceToDelete] = useState(null);

  const handleDeleteEducation = async (eduId) => {
    await deleteEducation(eduId);
    setEducationToDelete(null);
  };

  const handleDeleteExperience = async (expId) => {
    await deleteExperience(expId);
    setExperienceToDelete(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Present';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile</h1>
        <Link to="/dashboard" className="back-button">
          Back to Dashboard
        </Link>
      </div>

      <div className="profile-card">
        <div className="profile-info">
          <div className="profile-section">
            <h2 className="profile-name">{currentUser?.name}</h2>
            <span className="profile-role">{currentUser?.role}</span>
            
            {currentUser?.bio && (
              <p className="profile-bio">{currentUser?.bio}</p>
            )}
            
            <div className="profile-details">
              {currentUser?.email && (
                <div className="detail-item">
                  <span className="detail-icon">✉️</span>
                  <span className="detail-text">{currentUser?.email}</span>
                </div>
              )}
              
              {currentUser?.phone && (
                <div className="detail-item">
                  <span className="detail-icon">📱</span>
                  <span className="detail-text">{currentUser?.phone}</span>
                </div>
              )}
              
              {currentUser?.location && (
                <div className="detail-item">
                  <span className="detail-icon">📍</span>
                  <span className="detail-text">{currentUser?.location}</span>
                </div>
              )}
              
              <div className="detail-item">
                <span className="detail-icon">🗓️</span>
                <span className="detail-text">
                  Joined {new Date(currentUser?.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <Link to="/profile/edit" className="edit-button">
              Edit Profile
            </Link>
          </div>
          
          {currentUser?.skills?.length > 0 && (
            <div className="profile-section profile-skills">
              <h3>Skills</h3>
              <div className="skills-list">
                {currentUser.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {currentUser?.interests?.length > 0 && (
            <div className="profile-section profile-interests">
              <h3>Interests</h3>
              <div className="interests-list">
                {currentUser.interests.map((interest, index) => (
                  <span key={index} className="interest-tag">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {currentUser?.social && Object.values(currentUser.social).some(link => link) && (
            <div className="profile-section">
              <h3>Social Media</h3>
              <div className="social-links">
                {currentUser.social.linkedin && (
                  <a href={currentUser.social.linkedin} target="_blank" rel="noopener noreferrer" className="social-link">
                    <span>in</span>
                  </a>
                )}
                {currentUser.social.twitter && (
                  <a href={currentUser.social.twitter} target="_blank" rel="noopener noreferrer" className="social-link">
                    <span>𝕏</span>
                  </a>
                )}
                {currentUser.social.github && (
                  <a href={currentUser.social.github} target="_blank" rel="noopener noreferrer" className="social-link">
                    <span>gh</span>
                  </a>
                )}
                {currentUser.social.website && (
                  <a href={currentUser.social.website} target="_blank" rel="noopener noreferrer" className="social-link">
                    <span>🌐</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
        
        {currentUser?.education?.length > 0 && (
          <div className="timeline-section">
            <h3>Education</h3>
            {currentUser.education.map((edu, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-dot"></div>
                <p className="timeline-date">
                  {formatDate(edu.from)} - {formatDate(edu.to)}
                </p>
                <h4 className="timeline-title">{edu.degree || 'Degree'}</h4>
                <p className="timeline-subtitle">{edu.institution}</p>
                {edu.fieldOfStudy && (
                  <p className="timeline-subtitle">{edu.fieldOfStudy}</p>
                )}
                {edu.description && (
                  <p className="timeline-description">{edu.description}</p>
                )}
                <div className="timeline-actions">
                  <button 
                    className="timeline-delete" 
                    onClick={() => setEducationToDelete(edu._id)}
                  >
                    Delete
                  </button>
                  {educationToDelete === edu._id && (
                    <div>
                      <p>Are you sure?</p>
                      <button onClick={() => handleDeleteEducation(edu._id)}>Yes</button>
                      <button onClick={() => setEducationToDelete(null)}>No</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {currentUser?.experience?.length > 0 && (
          <div className="timeline-section">
            <h3>Experience</h3>
            {currentUser.experience.map((exp, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-dot"></div>
                <p className="timeline-date">
                  {formatDate(exp.from)} - {formatDate(exp.to)}
                </p>
                <h4 className="timeline-title">{exp.title}</h4>
                <p className="timeline-subtitle">{exp.company}</p>
                {exp.location && (
                  <p className="timeline-subtitle">{exp.location}</p>
                )}
                {exp.description && (
                  <p className="timeline-description">{exp.description}</p>
                )}
                <div className="timeline-actions">
                  <button 
                    className="timeline-delete" 
                    onClick={() => setExperienceToDelete(exp._id)}
                  >
                    Delete
                  </button>
                  {experienceToDelete === exp._id && (
                    <div>
                      <p>Are you sure?</p>
                      <button onClick={() => handleDeleteExperience(exp._id)}>Yes</button>
                      <button onClick={() => setExperienceToDelete(null)}>No</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 