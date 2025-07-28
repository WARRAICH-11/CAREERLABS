import React, { useContext, useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import './Auth.css';

// Validation schema
const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email')
    .required('Email is required')
});

const ForgotPassword = () => {
  const { forgotPassword, error, setError } = useContext(AuthContext);
  const [resetRequested, setResetRequested] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const [resetUrl, setResetUrl] = useState(null);

  // Clear any previous errors when component mounts
  useEffect(() => {
    setError(null);
  }, [setError]);

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting }) => {
    const result = await forgotPassword(values.email);
    
    if (result && result.success) {
      setResetRequested(true);
      
      // In a real app, you'd just show a message that an email was sent
      // For this demo, we're showing the reset token and URL
      if (result.token) {
        setResetToken(result.token);
      }
      if (result.resetUrl) {
        setResetUrl(result.resetUrl);
      }
    }
    
    setSubmitting(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Forgot Password</h2>
        
        {error && <div className="auth-error">{error}</div>}
        
        {resetRequested ? (
          <div className="reset-success">
            <p className="auth-success">Password reset email sent!</p>
            <p>Please check your email for instructions to reset your password.</p>
            
            {/* In a real app, you wouldn't display these */}
            {resetToken && (
              <div className="demo-box">
                <p><strong>Demo Only:</strong> Use this token to reset your password:</p>
                <code>{resetToken}</code>
              </div>
            )}
            
            {resetUrl && (
              <div className="demo-box">
                <p><strong>Reset URL:</strong></p>
                <code>{resetUrl}</code>
              </div>
            )}
            
            <div className="auth-links">
              <Link to="/login">Back to Login</Link>
            </div>
          </div>
        ) : (
          <>
            <p>Enter your email address and we'll send you instructions to reset your password.</p>
            
            <Formik
              initialValues={{ email: '' }}
              validationSchema={ForgotPasswordSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting }) => (
                <Form className="auth-form">
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <Field 
                      type="email" 
                      name="email" 
                      id="email" 
                      className="form-control" 
                    />
                    <ErrorMessage 
                      name="email" 
                      component="div" 
                      className="form-error" 
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="auth-button" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Reset Password'}
                  </button>
                </Form>
              )}
            </Formik>
            
            <div className="auth-links">
              <Link to="/login">Back to Login</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword; 