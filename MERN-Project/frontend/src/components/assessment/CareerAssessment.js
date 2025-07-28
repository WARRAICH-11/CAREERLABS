import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import assessmentQuestions from '../../data/assessmentQuestions';
import './Assessment.css';

const CareerAssessment = () => {
  const { submitAssessment, error, setError } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // Clear any errors when component mounts
  useEffect(() => {
    setError(null);
    
    // Initialize empty answers for all questions
    const initialAnswers = {};
    assessmentQuestions.forEach(q => {
      if (q.type === 'rating' || q.type === 'single') {
        initialAnswers[q.id] = null;
      } else if (q.type === 'multiselect') {
        initialAnswers[q.id] = [];
      }
    });
    
    setAnswers(initialAnswers);
  }, [setError]);
  
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === assessmentQuestions.length - 1;
  const currentQuestion = assessmentQuestions[currentStep];
  
  const handleNext = () => {
    if (isLastStep) {
      return;
    }
    setCurrentStep(currentStep + 1);
  };
  
  const handleBack = () => {
    if (isFirstStep) {
      return;
    }
    setCurrentStep(currentStep - 1);
  };
  
  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  const handleMultiselectToggle = (questionId, value) => {
    setAnswers(prev => {
      const currentValues = prev[questionId] || [];
      const valueExists = currentValues.includes(value);
      
      if (valueExists) {
        // Remove value if already selected
        return {
          ...prev,
          [questionId]: currentValues.filter(v => v !== value)
        };
      } else {
        // Add value if not selected
        return {
          ...prev,
          [questionId]: [...currentValues, value]
        };
      }
    });
  };
  
  const isAnswered = (questionId) => {
    const answer = answers[questionId];
    if (answer === null || answer === undefined) return false;
    if (Array.isArray(answer) && answer.length === 0) return false;
    return true;
  };
  
  const canProceed = isAnswered(currentQuestion?.id);
  
  const calculateProgress = () => {
    const answeredCount = Object.keys(answers).filter(key => isAnswered(key)).length;
    return Math.round((answeredCount / assessmentQuestions.length) * 100);
  };
  
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Format answers for API submission
      const formattedAnswers = Object.keys(answers).map(questionId => ({
        questionId,
        answer: answers[questionId]
      })).filter(item => isAnswered(item.questionId));
      
      const result = await submitAssessment(formattedAnswers);
      setSubmitting(false);
      
      if (result) {
        navigate('/assessment/results', { state: { categories: result.categories }});
      }
    } catch (error) {
      setSubmitting(false);
      console.error('Assessment submission error:', error);
    }
  };
  
  // Render different question types
  const renderQuestionContent = () => {
    if (!currentQuestion) return null;
    
    switch (currentQuestion.type) {
      case 'rating':
        return (
          <div className="rating-container">
            {currentQuestion.options.map(option => (
              <div 
                key={option.value} 
                className="rating-option"
                onClick={() => handleAnswerChange(currentQuestion.id, option.value)}
              >
                <button 
                  className={`rating-button ${answers[currentQuestion.id] === option.value ? 'selected' : ''}`}
                >
                  {option.value}
                </button>
                <span className="rating-label">{option.label}</span>
              </div>
            ))}
          </div>
        );
        
      case 'multiselect':
        return (
          <div className="multiselect-container">
            {currentQuestion.options.map(option => (
              <div 
                key={option.value} 
                className={`multiselect-option ${(answers[currentQuestion.id] || []).includes(option.value) ? 'selected' : ''}`}
                onClick={() => handleMultiselectToggle(currentQuestion.id, option.value)}
              >
                {option.label}
              </div>
            ))}
          </div>
        );
        
      case 'single':
        return (
          <div className="options-container">
            {currentQuestion.options.map(option => (
              <div 
                key={option.value} 
                className={`select-option ${answers[currentQuestion.id] === option.value ? 'selected' : ''}`}
                onClick={() => handleAnswerChange(currentQuestion.id, option.value)}
              >
                <div className="select-option-content">
                  <input
                    type="radio"
                    className="select-radio"
                    checked={answers[currentQuestion.id] === option.value}
                    onChange={() => {}} // Needed to avoid React warning
                  />
                  <span>{option.label}</span>
                </div>
              </div>
            ))}
          </div>
        );
        
      default:
        return <p>Unsupported question type</p>;
    }
  };
  
  return (
    <div className="assessment-container">
      <div className="assessment-header">
        <h1>Career Assessment</h1>
      </div>
      
      {error && <div className="profile-error">{error}</div>}
      
      <div className="assessment-card">
        <div className="assessment-intro">
          <p>
            This assessment will help identify your strengths and preferences across different career dimensions.
            Answer the questions honestly based on your own preferences and skills.
          </p>
        </div>
        
        <div className="assessment-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${calculateProgress()}%` }}
            ></div>
          </div>
          <div className="progress-text">
            <span>Question {currentStep + 1} of {assessmentQuestions.length}</span>
            <span>{calculateProgress()}% Complete</span>
          </div>
        </div>
        
        <div className="question-card">
          <div className="question-number">Question {currentStep + 1}</div>
          <div className="question-text">{currentQuestion?.question}</div>
          {renderQuestionContent()}
        </div>
        
        <div className="assessment-navigation">
          <button 
            className="nav-button back-button" 
            onClick={handleBack}
            disabled={isFirstStep}
          >
            Previous
          </button>
          
          {isLastStep ? (
            <button 
              className="nav-button submit-button" 
              onClick={handleSubmit}
              disabled={!canProceed || submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Assessment'}
            </button>
          ) : (
            <button 
              className="nav-button next-button" 
              onClick={handleNext}
              disabled={!canProceed}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CareerAssessment; 