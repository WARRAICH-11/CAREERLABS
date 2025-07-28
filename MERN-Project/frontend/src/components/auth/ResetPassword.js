import React, { useContext, useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Link, useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import './Auth.css';

// Validation schema
const ResetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm Password is required')
});

const ResetPassword = () => {
  const { resetPassword, isAuthenticated, error, setError } = useContext(AuthContext);
  const [resetSuccess, setResetSuccess] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  // Clear any previous errors when component mounts
  useEffect(() => {
    setError(null);
  }, [setError]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Redirect to login after successful reset
  useEffect(() => {
    if (resetSuccess) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [resetSuccess, navigate]);

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting }) => {
    // Only send password, not confirmPassword
    const success = await resetPassword(token, values.password);
    setResetSuccess(success);
    setSubmitting(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Reset Password</h2>
        
        {error && <div className="auth-error">{error}</div>}
        {resetSuccess && (
          <div className="auth-success">
            Password reset successful! You'll be redirected to login...
          </div>
        )}
        
        {!resetSuccess && (
          <Formik
            initialValues={{ password: '', confirmPassword: '' }}
            validationSchema={ResetPasswordSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="auth-form">
                <div className="form-group">
                  <label htmlFor="password">New Password</label>
                  <Field 
                    type="password" 
                    name="password" 
                    id="password" 
                    className="form-control" 
                  />
                  <ErrorMessage 
                    name="password" 
                    component="div" 
                    className="form-error" 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <Field 
                    type="password" 
                    name="confirmPassword" 
                    id="confirmPassword" 
                    className="form-control" 
                  />
                  <ErrorMessage 
                    name="confirmPassword" 
                    component="div" 
                    className="form-error" 
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="auth-button" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Resetting...' : 'Reset Password'}
                </button>
              </Form>
            )}
          </Formik>
        )}
        
        <div className="auth-links">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 