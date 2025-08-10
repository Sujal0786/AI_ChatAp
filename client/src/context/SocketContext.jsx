import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const [typingUsers, setTypingUsers] = useState(new Map());
  const { user, token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token && user) {
      const newSocket = io(import.meta.env.VITE_API_URL, {
        auth: {
          token
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setSocket(newSocket);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        toast.error('Connection failed');
      });

      // Handle user online/offline status
      newSocket.on('userOnline', (data) => {
        setOnlineUsers(prev => new Map(prev.set(data.userId, {
          ...data,
          isOnline: true
        })));
      });

      newSocket.on('userOffline', (data) => {
        setOnlineUsers(prev => new Map(prev.set(data.userId, {
          ...data,
          isOnline: false
        })));
      });

      // Handle typing indicators
      newSocket.on('userTyping', (data) => {
        setTypingUsers(prev => new Map(prev.set(data.userId, data)));
        
        // Clear typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => {
            const newMap = new Map(prev);
            newMap.delete(data.userId);
            return newMap;
          });
        }, 3000);
      });

      return () => {
        newSocket.close();
        setSocket(null);
        setOnlineUsers(new Map());
        setTypingUsers(new Map());
      };
    }
  }, [isAuthenticated, token, user]);

  const joinConversation = (conversationId) => {
    if (socket) {
      socket.emit('joinConversation', { conversationId });
    }
  };

  const leaveConversation = (conversationId) => {
    if (socket) {
      socket.emit('leaveConversation', { conversationId });
    }
  };

  const sendMessage = (messageData) => {
    if (socket) {
      socket.emit('sendMessage', messageData);
    }
  };

  const sendTyping = (receiver, isTyping) => {
    if (socket) {
      socket.emit('typing', { receiver, isTyping });
    }
  };

  const markAsRead = (messageIds) => {
    if (socket) {
      socket.emit('markAsRead', { messageIds });
    }
  };

  const value = {
    socket,
    onlineUsers,
    typingUsers,
    joinConversation,
    leaveConversation,
    sendMessage,
    sendTyping,
    markAsRead
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
