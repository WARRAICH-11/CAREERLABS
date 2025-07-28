import React, { useState, useEffect } from 'react';
import { Container, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import './Notifications.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCheck, faTrash, faFilter, faExclamationTriangle, faSyncAlt } from '@fortawesome/free-solid-svg-icons';

// Database error boundary component
const DatabaseErrorHandler = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);

  // Reset error state when retrying
  const handleRetry = () => {
    setHasError(false);
    setErrorInfo(null);
  };

  // If there's a database error, show a friendly error message with retry option
  if (hasError) {
    return (
      <Container className="notifications-page">
        <div className="database-error">
          <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
          <h2>Database Connection Issue</h2>
          <p>We're having trouble connecting to the database. This might be because:</p>
          <ul>
            <li>The database server is temporarily unavailable</li>
            <li>There are too many concurrent connections to the database</li>
            <li>Your internet connection is unstable</li>
          </ul>
          <p>{errorInfo}</p>
          <Button 
            variant="primary"
            onClick={handleRetry}
            className="retry-button"
          >
            <FontAwesomeIcon icon={faSyncAlt} spin /> Retry Connection
          </Button>
        </div>
      </Container>
    );
  }

  try {
    return children;
  } catch (error) {
    // Check if it's a database-related error
    if (error.message && (
      error.message.includes('database') || 
      error.message.includes('MongoDB') ||
      error.message.includes('connection') ||
      error.message.includes('timeout')
    )) {
      setHasError(true);
      setErrorInfo(error.message);
    }
    // Rethrow non-database errors
    throw error;
  }
};

const NotificationsPage = () => {
  const { 
    notifications, 
    loading, 
    error, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loadingMore, setLoadingMore] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    loadNotifications(1, activeFilter);
  }, [activeFilter]);

  const loadNotifications = async (page, filter) => {
    if (page === 1) {
      setLoadingMore(false);
    } else {
      setLoadingMore(true);
    }

    try {
      setConnectionError(false);
      const result = await fetchNotifications(page, 10, filter);
      
      if (result && result.data) {
        const { hasMore } = result.data;
        setCurrentPage(page);
        setHasMore(hasMore);
      }
    } catch (err) {
      if (err.message && (
        err.message.includes('database') || 
        err.message.includes('MongoDB') ||
        err.message.includes('connection') ||
        err.message.includes('timeout')
      )) {
        setConnectionError(true);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadNotifications(currentPage + 1, activeFilter);
    }
  };

  const handleFilterChange = (filter) => {
    if (filter !== activeFilter) {
      setActiveFilter(filter);
      setCurrentPage(1);
      setHasMore(true);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (notificationId) => {
    await deleteNotification(notificationId);
  };

  const renderNotificationContent = (notification) => {
    const { type, content } = notification;
    
    switch (type) {
      case 'message':
        return (
          <div>
            <strong>{content.from}</strong> sent you a message: "{content.preview}"
          </div>
        );
      case 'application':
        return (
          <div>
            Your application for <strong>{content.job}</strong> has been {content.status}
          </div>
        );
      case 'assessment':
        return (
          <div>
            You have {content.completed ? 'completed' : 'a new'} assessment: <strong>{content.name}</strong>
          </div>
        );
      case 'mentor':
        return (
          <div>
            Your mentoring session with <strong>{content.mentor}</strong> is {content.action}
          </div>
        );
      case 'system':
        return (
          <div>
            <strong>System:</strong> {content.message}
          </div>
        );
      default:
        return <div>{content.message || 'Notification'}</div>;
    }
  };

  const renderTimestamp = (date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  // If there's a connection error, show a friendly error message
  if (connectionError) {
    return (
      <Container className="notifications-page">
        <Alert variant="warning" className="database-warning">
          <FontAwesomeIcon icon={faExclamationTriangle} /> 
          <span>Database connection issue detected.</span>
          <Button 
            variant="outline-primary" 
            size="sm" 
            className="retry-button"
            onClick={() => loadNotifications(1, activeFilter)}
          >
            <FontAwesomeIcon icon={faSyncAlt} /> Retry
          </Button>
        </Alert>
        
        {/* Rest of the UI can still be shown with cached data if available */}
        {notifications.length > 0 && (
          <div className="notifications-list">
            {notifications.map(notification => (
              <div 
                key={notification._id} 
                className={`notification-item-full ${!notification.isRead ? 'unread' : ''}`}
                onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
              >
                <div className="notification-content">
                  {!notification.isRead && <Badge bg="primary" className="unread-badge">New</Badge>}
                  <div className="notification-text">
                    {renderNotificationContent(notification)}
                    <div className="notification-timestamp">
                      {renderTimestamp(notification.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="notification-actions">
                  {!notification.isRead && (
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="action-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification._id);
                      }}
                    >
                      <FontAwesomeIcon icon={faCheck} />
                    </Button>
                  )}
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    className="action-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification._id);
                    }}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    );
  }

  if (loading && currentPage === 1) {
    return (
      <Container className="notifications-page">
        <div className="notifications-loading">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading notifications...</span>
          </Spinner>
          <p>Loading notifications...</p>
        </div>
      </Container>
    );
  }

  if (error && currentPage === 1) {
    return (
      <Container className="notifications-page">
        <Alert variant="danger" className="notifications-error">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="notifications-page">
      <div className="notifications-header">
        <h1>
          <FontAwesomeIcon icon={faBell} /> Notifications
        </h1>
        
        <div className="notification-actions">
          <div className="filter-buttons">
            <Button 
              variant={activeFilter === 'all' ? 'primary' : 'outline-primary'} 
              className="filter-button"
              onClick={() => handleFilterChange('all')}
            >
              <FontAwesomeIcon icon={faFilter} /> All
            </Button>
            <Button 
              variant={activeFilter === 'unread' ? 'primary' : 'outline-primary'} 
              className="filter-button"
              onClick={() => handleFilterChange('unread')}
            >
              <FontAwesomeIcon icon={faFilter} /> Unread
            </Button>
          </div>
          
          <Button 
            variant="outline-success" 
            className="mark-all-read-button"
            onClick={handleMarkAllAsRead}
            disabled={!notifications.some(n => !n.isRead)}
          >
            <FontAwesomeIcon icon={faCheck} /> Mark All as Read
          </Button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="no-notifications">
          <p>No notifications found</p>
        </div>
      ) : (
        <>
          <div className="notifications-list">
            {notifications.map(notification => (
              <div 
                key={notification._id} 
                className={`notification-item-full ${!notification.isRead ? 'unread' : ''}`}
                onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
              >
                <div className="notification-content">
                  {!notification.isRead && <Badge bg="primary" className="unread-badge">New</Badge>}
                  <div className="notification-text">
                    {renderNotificationContent(notification)}
                    <div className="notification-timestamp">
                      {renderTimestamp(notification.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="notification-actions">
                  {!notification.isRead && (
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="action-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification._id);
                      }}
                    >
                      <FontAwesomeIcon icon={faCheck} />
                    </Button>
                  )}
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    className="action-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification._id);
                    }}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {hasMore && (
            <div className="load-more-container">
              <Button 
                variant="outline-primary" 
                onClick={loadMore} 
                disabled={loadingMore}
                className="load-more-button"
              >
                {loadingMore ? (
                  <>
                    <Spinner animation="border" size="sm" /> Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </Container>
  );
};

// Wrap the component with the DatabaseErrorHandler
const NotificationsPageWithErrorHandling = () => (
  <DatabaseErrorHandler>
    <NotificationsPage />
  </DatabaseErrorHandler>
);

export default NotificationsPageWithErrorHandling; 