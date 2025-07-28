import React, { useContext, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import MessageContext from '../../context/MessageContext';
import './Common.css';

const ConversationList = () => {
  const {
    conversations,
    loading,
    error,
    fetchConversations
  } = useContext(MessageContext);
  
  const navigate = useNavigate();
  const { userId } = useParams();

  // Fetch conversations when component mounts
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Format timestamp
  const formatLastMessageTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Get last message preview
  const getMessagePreview = (message) => {
    if (!message) return 'No messages yet';
    
    const MAX_LENGTH = 30;
    if (message.content.length <= MAX_LENGTH) {
      return message.content;
    }
    
    return `${message.content.substring(0, MAX_LENGTH)}...`;
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="conversations-loading">
        <div className="loader-spinner"></div>
        <p>Loading conversations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="conversations-error">
        <p>{error}</p>
        <button onClick={fetchConversations}>Try Again</button>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="no-conversations">
        <div className="empty-icon">💬</div>
        <h3>No conversations yet</h3>
        <p>Start a new conversation by messaging a user</p>
      </div>
    );
  }

  return (
    <div className="conversations-list">
      {conversations.map(conversation => (
        <Link
          key={conversation._id}
          to={`/messages/${conversation.participants[0]._id}`}
          className={`conversation-item ${userId === conversation.participants[0]._id ? 'active' : ''}`}
        >
          <div className="conversation-avatar">
            <img 
              src={conversation.participants[0].profileImage || 'https://via.placeholder.com/40'} 
              alt={conversation.participants[0].name}
            />
            {conversation.unreadCount > 0 && (
              <span className="unread-badge">{conversation.unreadCount}</span>
            )}
          </div>
          
          <div className="conversation-content">
            <div className="conversation-header">
              <h4 className="conversation-name">{conversation.participants[0].name}</h4>
              <span className="conversation-time">
                {formatLastMessageTime(conversation.updatedAt)}
              </span>
            </div>
            
            <p className="conversation-preview">
              {getMessagePreview(conversation.lastMessage)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default ConversationList; 