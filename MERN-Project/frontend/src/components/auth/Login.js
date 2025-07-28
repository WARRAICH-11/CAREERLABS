import React, { useContext, useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import './Auth.css';

// Validation schema
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters')
});

const Login = () => {
  const { login, isAuthenticated, error, setError } = useContext(AuthContext);
  const [loginSuccess, setLoginSuccess] = useState(false);
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

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting }) => {
    const success = await login(values);
    setLoginSuccess(success);
    setSubmitting(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        
        {error && <div className="auth-error">{error}</div>}
        {loginSuccess && (
          <div className="auth-success">Login successful! Redirecting...</div>
        )}
        
        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={LoginSchema}
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
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
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
              
              <button 
                type="submit" 
                className="auth-button" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging in...' : 'Login'}
              </button>
            </Form>
          )}
        </Formik>
        
        <div className="auth-links">
          <Link to="/forgot-password">Forgot Password?</Link>
          <span className="divider">|</span>
          <Link to="/register">Don't have an account? Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Login; 