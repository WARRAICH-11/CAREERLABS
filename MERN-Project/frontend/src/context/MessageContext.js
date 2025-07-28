import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from './AuthContext';
import NotificationContext from './NotificationContext';

// Create message context
export const MessageContext = createContext();

// Provider component
export const MessageProvider = ({ children }) => {
  const { isAuthenticated, currentUser } = useContext(AuthContext);
  const { socket } = useContext(NotificationContext);
  
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Listen for new messages via socket
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    // Listen for new messages
    socket.on('newMessage', (data) => {
      console.log('New message received:', data);
      
      // If related to active conversation, add to messages
      if (activeConversation && 
          activeConversation.participant._id === data.message.sender._id) {
        setMessages(prev => [...prev, data.message]);
        
        // Mark as read immediately
        markMessageAsRead(data.message.sender._id);
      }
      
      // Update conversations list with new message
      updateConversationWithMessage(data.message);
    });

    // Listen for typing indicators
    socket.on('userTyping', (data) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.userId]: true
      }));
      
      // Clear typing indicator after 3 seconds of inactivity
      setTimeout(() => {
        setTypingUsers(prev => ({
          ...prev,
          [data.userId]: false
        }));
      }, 3000);
    });

    socket.on('userStoppedTyping', (data) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.userId]: false
      }));
    });

    return () => {
      socket.off('newMessage');
      socket.off('userTyping');
      socket.off('userStoppedTyping');
    };
  }, [socket, isAuthenticated, activeConversation]);

  // Fetch conversations when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
      fetchUnreadCount();
    } else {
      setConversations([]);
      setMessages([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  // Update conversations with new message
  const updateConversationWithMessage = (message) => {
    setConversations(prev => {
      // Find if conversation exists
      const conversationIndex = prev.findIndex(
        c => c.participants[0]._id === message.sender._id || 
             c.participants[0]._id === message.recipient
      );
      
      if (conversationIndex >= 0) {
        // Update existing conversation
        const updatedConversations = [...prev];
        updatedConversations[conversationIndex] = {
          ...updatedConversations[conversationIndex],
          lastMessage: message,
          updatedAt: message.createdAt,
          unreadCount: activeConversation?.participant._id === message.sender._id 
            ? 0 // If active conversation, mark as read
            : updatedConversations[conversationIndex].unreadCount + 1
        };
        
        // Sort conversations by updatedAt
        return updatedConversations.sort((a, b) => 
          new Date(b.updatedAt) - new Date(a.updatedAt)
        );
      } else {
        // Create new conversation if sender is not current user
        if (message.sender._id !== currentUser?._id) {
          const newConversation = {
            _id: message.conversation,
            participants: [message.sender],
            lastMessage: message,
            unreadCount: 1,
            updatedAt: message.createdAt
          };
          
          return [newConversation, ...prev];
        }
        
        return prev;
      }
    });
    
    // Update total unread count
    if (activeConversation?.participant._id !== message.sender._id) {
      setUnreadCount(prev => prev + 1);
    }
  };

  // Fetch user conversations
  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.get('/api/messages/conversations');
      
      if (res.data.success) {
        setConversations(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a specific conversation
  const fetchMessages = async (userId, reset = true) => {
    try {
      if (reset) {
        setMessages([]);
        setPage(1);
        setHasMore(true);
      }
      
      setLoading(true);
      setError(null);
      
      const currentPage = reset ? 1 : page;
      const res = await axios.get(`/api/messages/${userId}?page=${currentPage}&limit=20`);
      
      if (res.data.success) {
        const newMessages = res.data.data.messages;
        
        if (reset) {
          setMessages(newMessages);
        } else {
          setMessages(prev => [...prev, ...newMessages]);
        }
        
        // Update active conversation
        setActiveConversation(res.data.data.conversation);
        
        // Update pagination
        setHasMore(newMessages.length === 20);
        setPage(currentPage + 1);
        
        // Update unread count
        fetchUnreadCount();
        
        // Update conversation unread count
        setConversations(prev => 
          prev.map(conv => 
            conv.participants[0]._id === userId 
              ? { ...conv, unreadCount: 0 } 
              : conv
          )
        );
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load more messages (pagination)
  const loadMoreMessages = async () => {
    if (!activeConversation || loading || !hasMore) return;
    
    await fetchMessages(activeConversation.participant._id, false);
  };

  // Send message
  const sendMessage = async (recipientId, content, attachments = []) => {
    try {
      setError(null);
      
      const res = await axios.post(`/api/messages/${recipientId}`, {
        content,
        attachments
      });
      
      if (res.data.success) {
        // Add message to state
        setMessages(prev => [...prev, res.data.data]);
        
        // Update conversation
        updateConversationWithMessage(res.data.data);
        
        return res.data.data;
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
      return null;
    }
  };

  // Mark message as read
  const markMessageAsRead = async (senderId) => {
    try {
      // This will be handled automatically by the backend when fetching messages
      await fetchMessages(senderId, false);
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    try {
      const res = await axios.delete(`/api/messages/message/${messageId}`);
      
      if (res.data.success) {
        // Remove message from state
        setMessages(prev => 
          prev.filter(msg => msg._id !== messageId)
        );
        
        // If it was the last message, update conversation
        if (activeConversation) {
          const remainingMessages = messages.filter(msg => msg._id !== messageId);
          
          if (remainingMessages.length > 0) {
            const lastMsg = remainingMessages[remainingMessages.length - 1];
            
            setConversations(prev => 
              prev.map(conv => 
                conv._id === activeConversation._id 
                  ? { ...conv, lastMessage: lastMsg } 
                  : conv
              )
            );
          }
        }
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      setError('Failed to delete message.');
    }
  };

  // Send typing indicator
  const sendTypingIndicator = (recipientId) => {
    if (socket && recipientId) {
      socket.emit('typing', { recipientId });
    }
  };

  // Send stop typing indicator
  const sendStopTypingIndicator = (recipientId) => {
    if (socket && recipientId) {
      socket.emit('stopTyping', { recipientId });
    }
  };

  // Fetch unread messages count
  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get('/api/messages/unread-count');
      
      if (res.data.success) {
        setUnreadCount(res.data.data.count);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  return (
    <MessageContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        unreadCount,
        loading,
        error,
        typingUsers,
        hasMore,
        fetchConversations,
        fetchMessages,
        loadMoreMessages,
        sendMessage,
        markMessageAsRead,
        deleteMessage,
        sendTypingIndicator,
        sendStopTypingIndicator,
        setActiveConversation
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};

export default MessageContext; 