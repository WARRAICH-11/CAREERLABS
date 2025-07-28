import React, { useContext } from 'react';
import { useParams } from 'react-router-dom';
import ConversationList from '../common/ConversationList';
import Chat from '../common/Chat';
import { MessageProvider } from '../../context/MessageContext';
import AuthContext from '../../context/AuthContext';
import '../common/Common.css';

const MessagesPage = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const { userId } = useParams();

  if (!isAuthenticated) {
    return (
      <div className="messages-auth-required">
        <h3>Please log in to view your messages</h3>
      </div>
    );
  }

  return (
    <div className="messages-page">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Messages</h2>
        </div>
        <ConversationList />
      </div>
      
      <div className="main-content">
        {userId ? (
          <Chat userId={userId} height="100%" />
        ) : (
          <div className="chat-empty-state">
            <div className="chat-empty-icon">💬</div>
            <h3 className="chat-empty-message">Select a conversation</h3>
            <p className="chat-empty-subtext">
              Choose a conversation from the list or start a new one
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const MessagesPageWithProvider = () => (
  <MessageProvider>
    <MessagesPage />
  </MessageProvider>
);

export default MessagesPageWithProvider; 