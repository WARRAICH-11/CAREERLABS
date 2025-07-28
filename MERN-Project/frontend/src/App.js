import React, { useContext } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthContext } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import Dashboard from './components/Dashboard';
import Profile from './components/profile/Profile';
import EditProfile from './components/profile/EditProfile';
import CareerAssessment from './components/assessment/CareerAssessment';
import AssessmentResults from './components/assessment/AssessmentResults';
import CareerRecommendations from './components/recommendation/CareerRecommendations';
import DataImport from './components/admin/DataImport';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './components/Home';
import JobApplicationForm from './components/jobs/JobApplicationForm';
import UserApplications from './components/jobs/UserApplications';
import MessagesPage from './components/messages/MessagesPage';
import NotificationsPage from './components/notifications/NotificationsPage';
import Navbar from './components/common/Navbar';
import './App.css';

// Component to check if user is admin
const AdminRoute = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';
  
  return isAdmin ? <Outlet /> : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <div className="app-container">
            <Navbar />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/resetpassword/:token" element={<ResetPassword />} />
              
              {/* Protected routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/edit" element={<EditProfile />} />
                <Route path="/assessment" element={<CareerAssessment />} />
                <Route path="/assessment/results" element={<AssessmentResults />} />
                <Route path="/recommendations" element={<CareerRecommendations />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/messages/:userId" element={<MessagesPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                
                {/* Admin routes */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin/import" element={<DataImport />} />
                </Route>
              </Route>
              
              {/* Job application routes */}
              <Route path="/jobs/:jobId/apply" element={
                <PrivateRoute>
                  <JobApplicationForm />
                </PrivateRoute>
              } />
              <Route path="/applications" element={
                <PrivateRoute>
                  <UserApplications />
                </PrivateRoute>
              } />
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App; 