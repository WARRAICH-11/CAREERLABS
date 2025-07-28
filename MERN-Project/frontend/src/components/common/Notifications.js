import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationContext from '../../context/NotificationContext';
import './Common.css';

const Notifications = () => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useContext(NotificationContext);
  
  const [isOpen, setIsOpen] = useState(false);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    
    if (notification.url) {
      navigate(notification.url);
    }
    
    setIsOpen(false);
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return '💬';
      case 'job_alert':
        return '💼';
      case 'session_reminder':
        return '🗓️';
      case 'application_update':
        return '📝';
      case 'assessment':
        return '📊';
      case 'system':
        return '🔔';
      default:
        return '📣';
    }
  };

  return (
    <div className="notifications-container" ref={notificationRef}>
      <button 
        className="notification-bell" 
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            fetchNotifications();
          }
        }}
      >
        {unreadCount > 0 ? (
          <>
            <span className="bell-icon">🔔</span>
            <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          </>
        ) : (
          <span className="bell-icon">🔔</span>
        )}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read" 
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          {loading ? (
            <div className="notifications-loading">Loading...</div>
          ) : error ? (
            <div className="notifications-error">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="no-notifications">
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map(notification => (
                <div 
                  key={notification._id} 
                  className={`notification-item ${notification.read ? '' : 'unread'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <p className="notification-message">{notification.content}</p>
                    <div className="notification-time">
                      {formatDate(notification.createdAt)}
                    </div>
                  </div>
                  <button 
                    className="notification-delete" 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification._id);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="notifications-footer">
            <button 
              className="view-all" 
              onClick={() => {
                navigate('/notifications');
                setIsOpen(false);
              }}
            >
              View all
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications; 