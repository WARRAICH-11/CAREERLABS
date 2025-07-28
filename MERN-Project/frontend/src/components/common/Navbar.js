import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { FaGraduationCap, FaBell, FaEnvelope, FaSignOutAlt, FaUser, FaClipboardList, FaTools } from 'react-icons/fa';
import AuthContext from '../../context/AuthContext';
import MessageContext from '../../context/MessageContext';
import Notifications from './Notifications';
import './Common.css';

const Navbar = () => {
  const { isAuthenticated, currentUser, logout } = useContext(AuthContext);
  
  // We need to wrap this in a try-catch because MessageContext might not be available
  // if NotificationProvider is not wrapped around it
  let unreadMessageCount = 0;
  try {
    const messageContext = useContext(MessageContext);
    if (messageContext) {
      unreadMessageCount = messageContext.unreadCount;
    }
  } catch (error) {
    console.error('MessageContext not available:', error);
  }

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/">
            <FaGraduationCap className="logo-icon" />
            <span className="logo-text">CAREER LABS</span>
          </Link>
        </div>
        
        <div className="navbar-links">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/recommendations" className="nav-link">Recommendations</Link>
              <Link to="/messages" className="nav-link">
                <FaEnvelope className="nav-icon" />
                {unreadMessageCount > 0 && (
                  <span className="message-badge">{unreadMessageCount}</span>
                )}
              </Link>
              
              <div className="nav-notification">
                <Notifications />
              </div>
              
              <div className="nav-profile">
                <img 
                  src={currentUser?.profileImage || "https://via.placeholder.com/30"} 
                  alt={currentUser?.name || "User"} 
                  className="profile-image"
                />
                <div className="profile-dropdown">
                  <Link to="/profile" className="dropdown-item">
                    <FaUser className="dropdown-icon" /> Profile
                  </Link>
                  <Link to="/applications" className="dropdown-item">
                    <FaClipboardList className="dropdown-icon" /> Applications
                  </Link>
                  {currentUser?.role === 'admin' && (
                    <Link to="/admin/import" className="dropdown-item">
                      <FaTools className="dropdown-icon" /> Admin Panel
                    </Link>
                  )}
                  <button onClick={handleLogout} className="dropdown-item logout-button">
                    <FaSignOutAlt className="dropdown-icon" /> Logout
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link login-btn">Login</Link>
              <Link to="/register" className="nav-link register-btn">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 