import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Create the auth context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set auth token in headers
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  };

  // Initialize - check if user is already logged in
  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      
      // If token exists, set it in axios headers
      if (token) {
        setAuthToken(token);
        
        try {
          const res = await axios.get('/api/users/me');
          setUser(res.data);
          setIsAuthenticated(true);
        } catch (err) {
          console.error('Error loading user:', err);
          setUser(null);
          setIsAuthenticated(false);
          setAuthToken(null);
        }
      }
      
      setLoading(false);
    };

    loadUser();
  }, [token]);

  // Login user
  const login = async (email, password) => {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    try {
      setError(null);
      const res = await axios.post('/api/auth/login', { email, password }, config);
      setToken(res.data.token);
      setAuthToken(res.data.token);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
      return false;
    }
  };

  // Register user
  const register = async (userData) => {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    try {
      setError(null);
      const res = await axios.post('/api/auth/register', userData, config);
      setToken(res.data.token);
      setAuthToken(res.data.token);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      return false;
    }
  };

  // Logout user
  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setToken(null);
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const res = await axios.put('/api/users/profile', profileData);
      setUser(res.data);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      return false;
    }
  };

  // Password reset request
  const requestPasswordReset = async (email) => {
    try {
      setError(null);
      await axios.post('/api/auth/forgot-password', { email });
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request password reset');
      return false;
    }
  };

  // Reset password with token
  const resetPassword = async (token, password) => {
    try {
      setError(null);
      await axios.post('/api/auth/reset-password', { token, password });
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
      return false;
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        requestPasswordReset,
        resetPassword,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 