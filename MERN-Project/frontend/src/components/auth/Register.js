import React, { useContext, useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import './Auth.css';

// Validation schema
const RegisterSchema = Yup.object().shape({
  name: Yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot be more than 50 characters'),
  email: Yup.string()
    .email('Invalid email')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm Password is required')
});

const Register = () => {
  const { register, isAuthenticated, error, setError } = useContext(AuthContext);
  const [registerSuccess, setRegisterSuccess] = useState(false);
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
    // Remove confirmPassword as it's not needed for the backend
    const { confirmPassword, ...userData } = values;
    const success = await register(userData);
    setRegisterSuccess(success);
    setSubmitting(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Register</h2>
        
        {error && <div className="auth-error">{error}</div>}
        {registerSuccess && (
          <div className="auth-success">Registration successful! Redirecting...</div>
        )}
        
        <Formik
          initialValues={{ name: '', email: '', password: '', confirmPassword: '' }}
          validationSchema={RegisterSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="auth-form">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <Field 
                  type="text" 
                  name="name" 
                  id="name" 
                  className="form-control" 
                />
                <ErrorMessage 
                  name="name" 
                  component="div" 
                  className="form-error" 
                />
              </div>
              
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
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
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
                {isSubmitting ? 'Registering...' : 'Register'}
              </button>
            </Form>
          )}
        </Formik>
        
        <div className="auth-links">
          <Link to="/login">Already have an account? Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register; 