import React from 'react';
import './Recommendation.css';

const SkillRecommendation = ({ skills = [] }) => {
  if (!skills || skills.length === 0) {
    return (
      <div className="skills-empty">
        <h3>No skill recommendations available</h3>
        <p>Complete your profile or take a career assessment to get personalized skill recommendations.</p>
      </div>
    );
  }

  // Group skills by category
  const skillsByCategory = skills.reduce((acc, skill) => {
    const category = skill.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {});

  return (
    <div className="skills-recommendation">
      <div className="skills-header">
        <h2>Recommended Skills to Develop</h2>
        <p>Based on your profile and top job matches, these skills could help advance your career.</p>
      </div>

      <div className="skills-content">
        {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
          <div key={category} className="skill-category">
            <h3 className="category-title">{category}</h3>
            <div className="skill-list">
              {categorySkills.map((skill) => (
                <div key={skill.name} className="skill-card">
                  <div className="skill-header">
                    <h4 className="skill-name">{skill.name}</h4>
                    <span className="skill-frequency">
                      Priority: {skill.frequency > 3 ? 'High' : (skill.frequency > 1 ? 'Medium' : 'Low')}
                    </span>
                  </div>
                  <div className="skill-level">
                    <span className="level-label">Recommended level:</span>
                    <span className="level-value">{skill.level}</span>
                  </div>
                  <p className="skill-description">{skill.description}</p>
                  <div className="skill-actions">
                    <button className="learn-button">Learn More</button>
                    <button className="add-button">Add to Goals</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="learning-resources">
        <h3>Learning Resources</h3>
        <div className="resource-list">
          <div className="resource-card">
            <h4>Online Courses</h4>
            <p>Access free and paid courses through our learning partners.</p>
            <button>Browse Courses</button>
          </div>
          <div className="resource-card">
            <h4>Skill Development Plans</h4>
            <p>Create a personalized learning plan based on your goals.</p>
            <button>Create Plan</button>
          </div>
          <div className="resource-card">
            <h4>Skill Assessment</h4>
            <p>Evaluate your current skill level and identify gaps.</p>
            <button>Take Assessment</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillRecommendation; 