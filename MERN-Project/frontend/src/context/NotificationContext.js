import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/axiosConfig';
import { io } from 'socket.io-client';
import AuthContext from './AuthContext';

// Create notification context
export const NotificationContext = createContext();

// Provider component
export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, token } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Set up socket connection
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    const socketInstance = io(SOCKET_URL);
    setSocket(socketInstance);

    // Socket event listeners
    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      
      // Authenticate socket with JWT token
      socketInstance.emit('authenticate', token);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('notification', (data) => {
      console.log('Notification received:', data);
      
      // Add notification to state
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Play notification sound if enabled
      playNotificationSound();
    });

    // Clean up socket connection
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [isAuthenticated, token]);

  // Fetch notifications when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      fetchUnreadCount();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  // Play notification sound
  const playNotificationSound = () => {
    // Check if user has enabled notification sounds
    const soundEnabled = localStorage.getItem('notificationSound') !== 'disabled';
    
    if (soundEnabled) {
      try {
        const audio = new Audio('/notification-sound.mp3');
        audio.play().catch(err => console.error('Failed to play notification sound:', err));
      } catch (err) {
        console.error('Error playing notification sound:', err);
      }
    }
  };

  // Fetch user notifications
  const fetchNotifications = async (page = 1, limit = 10, filter = 'all') => {
    if (!isAuthenticated) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      const params = { page, limit };
      if (filter === 'unread') {
        params.filter = 'unread';
      }
      
      // Add retry logic for database connection issues
      let attempts = 0;
      const maxAttempts = 3;
      let lastError = null;
      
      while (attempts < maxAttempts) {
        try {
          const res = await api.get('/notifications', { params });
          
          if (res.data && res.data.success) {
            const hasMore = res.data.pagination 
              ? page < res.data.pagination.pages 
              : false;
              
            if (page === 1) {
              setNotifications(res.data.data || []);
            } else {
              setNotifications(prev => [...prev, ...(res.data.data || [])]);
            }
            
            return {
              success: true,
              data: {
                notifications: res.data.data,
                hasMore,
                pagination: res.data.pagination
              }
            };
          }
          return null;
        } catch (err) {
          lastError = err;
          // Only retry on connection issues or 500 errors
          if (err.code === 'ECONNABORTED' || 
              !err.response || 
              err.response.status === 500) {
            attempts++;
            // Wait before retrying (exponential backoff)
            await new Promise(r => setTimeout(r, 1000 * attempts));
            console.log(`Retrying notifications fetch (attempt ${attempts}/${maxAttempts})...`);
          } else {
            // Don't retry for other errors (like 401, 403, etc.)
            throw err;
          }
        }
      }
      
      // If we've exhausted all retries, throw the last error
      throw lastError;
    } catch (err) {
      console.error('Error fetching notifications:', err);
      if (err.code === 'ECONNABORTED' || !err.response) {
        setError('Connection timeout. Please check your internet connection and try again.');
      } else if (err.response?.status === 500) {
        setError('Server error. This could be due to database connection issues. Please try again later.');
      } else {
        setError('Failed to load notifications. Please try again.');
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    
    try {
      const res = await api.get('/notifications/unread-count');
      
      if (res.data.success) {
        setUnreadCount(res.data.data.count);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    if (!isAuthenticated) return null;
    
    try {
      const res = await api.patch(`/notifications/${notificationId}/read`);
      
      if (res.data.success) {
        // Update notifications state
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, read: true } 
              : notif
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
        return res.data;
      }
      return null;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Failed to mark notification as read.');
      return null;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!isAuthenticated) return null;
    
    try {
      const res = await api.patch('/notifications/mark-all-read');
      
      if (res.data.success) {
        // Update all notifications to read
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
        
        // Set unread count to 0
        setUnreadCount(0);
        return res.data;
      }
      return null;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to mark all notifications as read.');
      return null;
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    if (!isAuthenticated) return null;
    
    try {
      const res = await api.delete(`/notifications/${notificationId}`);
      
      if (res.data.success) {
        // Remove from state
        setNotifications(prev => 
          prev.filter(notif => notif._id !== notificationId)
        );
        
        // Update unread count if needed
        const notif = notifications.find(n => n._id === notificationId);
        if (notif && !notif.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        return res.data;
      }
      return null;
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError('Failed to delete notification.');
      return null;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        socket,
        isConnected,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook for using notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext; 