import React from 'react';
import './Recommendation.css';

const CareerPath = ({ careerPath, selectedJob }) => {
  if (!careerPath) {
    return (
      <div className="path-empty">
        <h3>No career path available</h3>
        <p>We couldn't generate a career path based on your current profile. 
          Please complete your profile or select a job to see a potential career path.</p>
      </div>
    );
  }

  return (
    <div className="career-path">
      <div className="path-header">
        <h2>Your Career Roadmap</h2>
        <div className="path-meta">
          <div className="current-level">
            <span>Current Level:</span>
            <strong>{careerPath.currentLevel}</strong>
          </div>
          <div className="target-level">
            <span>Target Level:</span>
            <strong>{careerPath.targetLevel}</strong>
          </div>
          {selectedJob && (
            <div className="target-job">
              <span>Target Job:</span>
              <strong>{selectedJob.title}</strong>
            </div>
          )}
        </div>
      </div>

      <div className="path-timeline">
        {careerPath.steps.map((step, index) => (
          <div 
            key={`${step.title}-${index}`} 
            className={`path-step ${index === 0 ? 'current' : ''} ${index === careerPath.steps.length - 1 ? 'target' : ''}`}
          >
            <div className="step-connector">
              <div className="connector-line"></div>
              <div className="connector-dot"></div>
            </div>
            <div className="step-content">
              <div className="step-header">
                <h3 className="step-title">{step.title}</h3>
                <span className="step-timeframe">{step.timeframe}</span>
              </div>
              <p className="step-description">{step.description}</p>
              <div className="step-skills">
                <h4>Key Skills</h4>
                <div className="skills-tags">
                  {step.skills && step.skills.map((skill, i) => (
                    <span key={`${skill}-${i}`} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
              <div className="step-actions">
                {index === 0 ? (
                  <button className="action-button current">Current Position</button>
                ) : index === careerPath.steps.length - 1 ? (
                  <button className="action-button target">Target Position</button>
                ) : (
                  <button className="action-button intermediate">Explore Position</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="path-insights">
        <h3>Career Path Insights</h3>
        <div className="insights-cards">
          <div className="insight-card">
            <h4>Education Needed</h4>
            <p>Recommendations for education or certifications that could help you advance.</p>
            <ul>
              {selectedJob && selectedJob.title.toLowerCase().includes('developer') && (
                <>
                  <li>Bachelor's in Computer Science or related field</li>
                  <li>Full-stack development certification</li>
                </>
              )}
              {selectedJob && selectedJob.title.toLowerCase().includes('manager') && (
                <>
                  <li>MBA or management certification</li>
                  <li>Leadership training program</li>
                </>
              )}
              {selectedJob && selectedJob.title.toLowerCase().includes('designer') && (
                <>
                  <li>Design degree or certification</li>
                  <li>UX/UI specialization courses</li>
                </>
              )}
              <li>Industry-specific certifications</li>
            </ul>
          </div>
          <div className="insight-card">
            <h4>Experience Requirements</h4>
            <p>Typical experience needed to progress along this career path.</p>
            <ul>
              <li>{careerPath.currentLevel} to {careerPath.targetLevel} typically requires {Math.max(2, careerPath.steps.length - 1)} years of focused experience</li>
              <li>Project leadership opportunities</li>
              <li>Cross-functional team collaboration</li>
            </ul>
          </div>
          <div className="insight-card">
            <h4>Industry Trends</h4>
            <p>Current trends that may impact this career path.</p>
            <ul>
              <li>Growing demand for digital transformation skills</li>
              <li>Increasing emphasis on data analysis capabilities</li>
              <li>Remote work opportunities expanding in this field</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerPath; 