import React, { useContext, useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import MessageContext from '../../context/MessageContext';
import AuthContext from '../../context/AuthContext';
import './Common.css';

const Chat = ({ userId, height = '500px' }) => {
  const {
    messages,
    activeConversation,
    loading,
    error,
    typingUsers,
    hasMore,
    fetchMessages,
    loadMoreMessages,
    sendMessage,
    sendTypingIndicator,
    sendStopTypingIndicator
  } = useContext(MessageContext);
  
  const { currentUser } = useContext(AuthContext);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesContainerRef = useRef(null);
  const typingTimeout = useRef(null);
  
  // Get userId from URL if not provided as prop
  const params = useParams();
  const chatUserId = userId || params.userId;

  // Fetch messages when component mounts or chatUserId changes
  useEffect(() => {
    if (chatUserId) {
      fetchMessages(chatUserId);
    }
  }, [chatUserId, fetchMessages]);

  // Scroll to bottom when new messages come in
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 0;
    }
  }, [messages]);

  // Handle scroll to load more messages
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    
    // Check if scrolled to bottom (accounting for reversed flex direction)
    if (scrollTop <= 10 && hasMore && !loading) {
      loadMoreMessages();
    }
  };

  // Handle send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageInput.trim() || isSending) return;
    
    setIsSending(true);
    
    try {
      await sendMessage(chatUserId, messageInput);
      setMessageInput('');
      sendStopTypingIndicator(chatUserId);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Handle input change with typing indicator
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    // Send typing indicator
    sendTypingIndicator(chatUserId);
    
    // Clear previous timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    
    // Set new timeout to stop typing indicator after 3 seconds of inactivity
    typingTimeout.current = setTimeout(() => {
      sendStopTypingIndicator(chatUserId);
    }, 3000);
  };

  // Format timestamp
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!chatUserId) {
    return (
      <div className="chat-empty-state">
        <div className="chat-empty-icon">💬</div>
        <h3 className="chat-empty-message">Select a conversation</h3>
        <p className="chat-empty-subtext">
          Choose a conversation from the list to start chatting
        </p>
      </div>
    );
  }

  if (loading && messages.length === 0) {
    return (
      <div className="chat-container" style={{ height }}>
        <div className="chat-loading">
          <div className="loader-spinner"></div>
          <p>Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-container" style={{ height }}>
        <div className="chat-error">
          <p>{error}</p>
          <button onClick={() => fetchMessages(chatUserId)}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container" style={{ height }}>
      {activeConversation && (
        <>
          <div className="chat-header">
            <img 
              src={activeConversation.participant.profileImage || 'https://via.placeholder.com/40'} 
              alt={activeConversation.participant.name}
              className="chat-avatar"
            />
            <div className="chat-user-info">
              <h3 className="chat-username">{activeConversation.participant.name}</h3>
              {typingUsers[activeConversation.participant._id] && (
                <p className="chat-status">Typing...</p>
              )}
            </div>
          </div>
          
          <div 
            className="chat-messages" 
            ref={messagesContainerRef}
            onScroll={handleScroll}
          >
            {messages.map((message) => (
              <div 
                key={message._id} 
                className={`chat-message ${message.sender._id === currentUser?._id ? 'message-sent' : 'message-received'}`}
              >
                {message.content}
                <span className="message-time">{formatTime(message.createdAt)}</span>
              </div>
            ))}
            
            {loading && messages.length > 0 && (
              <div className="chat-loading-more">Loading older messages...</div>
            )}
          </div>
          
          <form onSubmit={handleSendMessage} className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              placeholder="Type a message..."
              value={messageInput}
              onChange={handleInputChange}
              disabled={isSending}
            />
            <button 
              type="submit" 
              className="send-button"
              disabled={!messageInput.trim() || isSending}
            >
              ➤
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default Chat; 