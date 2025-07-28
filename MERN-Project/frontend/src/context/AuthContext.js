import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/axiosConfig';
import { jwtDecode } from 'jwt-decode';
import { logError } from '../utils/errorHandler';

// Create auth context
export const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if token is valid
  const isTokenValid = (token) => {
    if (!token) return false;
    
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired
      return decoded.exp > currentTime;
    } catch (error) {
      return false;
    }
  };

  // Set auth token in axios headers and localStorage
  const setAuthToken = (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  };

  // Load user data if token exists
  const loadUser = async () => {
    try {
      if (!token || !isTokenValid(token)) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setAuthToken(null);
        setLoading(false);
        return;
      }

      setAuthToken(token);
      const res = await api.get('auth/me');
      setCurrentUser(res.data.data);
      setIsAuthenticated(true);
      setError(null);
    } catch (err) {
      logError(err, 'AuthContext.loadUser');
      setIsAuthenticated(false);
      setCurrentUser(null);
      setAuthToken(null);
      setError('Failed to load user data. Please log in again.');
    } finally {
      setLoading(false);
    }
  };

  // Register user
  const register = async (userData) => {
    try {
      setLoading(true);
      const res = await api.post('auth/register', userData);
      
      if (res.data.success && res.data.token) {
        setToken(res.data.token);
        setAuthToken(res.data.token);
        await loadUser();
        setError(null);
        return true;
      }
    } catch (err) {
      logError(err, 'AuthContext.register');
      setError(
        err.response?.data?.message || 'Registration failed. Please try again.'
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (userData) => {
    try {
      setLoading(true);
      const res = await api.post('auth/login', userData);
      
      if (res.data.success && res.data.token) {
        setToken(res.data.token);
        setAuthToken(res.data.token);
        await loadUser();
        setError(null);
        return true;
      }
    } catch (err) {
      logError(err, 'AuthContext.login');
      setError(
        err.response?.data?.message || 'Login failed. Please check your credentials.'
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      setLoading(true);
      await api.get('auth/logout');
    } catch (err) {
      logError(err, 'AuthContext.logout');
    } finally {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setToken(null);
      setAuthToken(null);
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      const res = await api.put('/profile', profileData);
      
      if (res.data.success) {
        setCurrentUser(res.data.data);
        setError(null);
        return true;
      }
    } catch (err) {
      logError(err, 'AuthContext.updateProfile');
      setError(
        err.response?.data?.message || 'Failed to update profile.'
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Add education
  const addEducation = async (eduData) => {
    try {
      setLoading(true);
      const res = await api.post('/profile/education', eduData);
      
      if (res.data.success) {
        setCurrentUser(res.data.data);
        setError(null);
        return true;
      }
    } catch (err) {
      logError(err, 'AuthContext.addEducation');
      setError(
        err.response?.data?.message || 'Failed to add education.'
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete education
  const deleteEducation = async (eduId) => {
    try {
      setLoading(true);
      const res = await api.delete(`/profile/education/${eduId}`);
      
      if (res.data.success) {
        setCurrentUser(res.data.data);
        setError(null);
        return true;
      }
    } catch (err) {
      logError(err, 'AuthContext.deleteEducation');
      setError(
        err.response?.data?.message || 'Failed to delete education.'
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Add experience
  const addExperience = async (expData) => {
    try {
      setLoading(true);
      const res = await api.post('/profile/experience', expData);
      
      if (res.data.success) {
        setCurrentUser(res.data.data);
        setError(null);
        return true;
      }
    } catch (err) {
      logError(err, 'AuthContext.addExperience');
      setError(
        err.response?.data?.message || 'Failed to add experience.'
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete experience
  const deleteExperience = async (expId) => {
    try {
      setLoading(true);
      const res = await api.delete(`/profile/experience/${expId}`);
      
      if (res.data.success) {
        setCurrentUser(res.data.data);
        setError(null);
        return true;
      }
    } catch (err) {
      logError(err, 'AuthContext.deleteExperience');
      setError(
        err.response?.data?.message || 'Failed to delete experience.'
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get profile by ID (admin only)
  const getProfileById = async (userId) => {
    try {
      setLoading(true);
      const res = await api.get(`/profile/user/${userId}`);
      
      setError(null);
      return res.data.data;
    } catch (err) {
      logError(err, 'AuthContext.getProfileById');
      setError(
        err.response?.data?.message || 'Failed to fetch profile.'
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get all profiles (admin only)
  const getAllProfiles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/profile');
      
      setError(null);
      return res.data.data;
    } catch (err) {
      logError(err, 'AuthContext.getAllProfiles');
      setError(
        err.response?.data?.message || 'Failed to fetch profiles.'
      );
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Update user role (admin only)
  const updateUserRole = async (userId, role) => {
    try {
      setLoading(true);
      const res = await api.put(`/profile/role/${userId}`, { role });
      
      setError(null);
      return res.data.data;
    } catch (err) {
      logError(err, 'AuthContext.updateUserRole');
      setError(
        err.response?.data?.message || 'Failed to update user role.'
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/forgotpassword', { email });
      setError(null);
      return res.data;
    } catch (err) {
      logError(err, 'AuthContext.forgotPassword');
      setError(
        err.response?.data?.message || 'Failed to send password reset email.'
      );
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (token, password) => {
    try {
      setLoading(true);
      const res = await api.put(`/auth/resetpassword/${token}`, { password });
      
      if (res.data.success && res.data.token) {
        setToken(res.data.token);
        setAuthToken(res.data.token);
        await loadUser();
        setError(null);
        return true;
      }
    } catch (err) {
      logError(err, 'AuthContext.resetPassword');
      setError(
        err.response?.data?.message || 'Failed to reset password.'
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update password for logged in user
  const updatePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      const res = await api.put('/auth/updatepassword', {
        currentPassword,
        newPassword
      });
      
      if (res.data.success && res.data.token) {
        setToken(res.data.token);
        setAuthToken(res.data.token);
        setError(null);
        return true;
      }
    } catch (err) {
      logError(err, 'AuthContext.updatePassword');
      setError(
        err.response?.data?.message || 'Failed to update password.'
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Submit career assessment
  const submitAssessment = async (answers) => {
    try {
      setLoading(true);
      const res = await api.post('/assessment', { answers });
      
      setError(null);
      return res.data.data;
    } catch (err) {
      logError(err, 'AuthContext.submitAssessment');
      setError(
        err.response?.data?.message || 'Failed to submit assessment.'
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get all user assessments
  const getUserAssessments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assessment');
      
      setError(null);
      return res.data.data;
    } catch (err) {
      logError(err, 'AuthContext.getUserAssessments');
      setError(
        err.response?.data?.message || 'Failed to fetch assessments.'
      );
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get latest user assessment
  const getLatestAssessment = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assessment/latest');
      
      setError(null);
      return res.data.data;
    } catch (err) {
      if (err.response?.status === 404) {
        return null; // No assessments found, not an error
      }
      
      logError(err, 'AuthContext.getLatestAssessment');
      setError(
        err.response?.data?.message || 'Failed to fetch latest assessment.'
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Load user on initial app load
  useEffect(() => {
    loadUser();
  }, []);

  // Create context value object
  const contextValue = {
    currentUser,
    isAuthenticated,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    addEducation,
    deleteEducation,
    addExperience,
    deleteExperience,
    getProfileById,
    getAllProfiles,
    updateUserRole,
    forgotPassword,
    resetPassword,
    updatePassword,
    setError,
    submitAssessment,
    getUserAssessments,
    getLatestAssessment
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 