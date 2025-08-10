import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const ChatContext = createContext();

const chatReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    
    case 'SET_ACTIVE_CONVERSATION':
      return { ...state, activeConversation: action.payload };
    
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };
    
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg._id === action.payload._id ? action.payload : msg
        )
      };
    
    case 'SET_USERS':
      return { ...state, users: action.payload };
    
    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv._id === action.payload._id ? action.payload : conv
        )
      };
    
    default:
      return state;
  }
};

const initialState = {
  conversations: [],
  activeConversation: null,
  messages: [],
  users: [],
  loading: false
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { socket } = useSocket();
  const { user } = useAuth();

  // Socket event listeners
  useEffect(() => {
    if (socket) {
      socket.on('newMessage', (message) => {
        dispatch({ type: 'ADD_MESSAGE', payload: message });
        // Update conversation with new message
        fetchConversations();
      });

      socket.on('messageReceived', (data) => {
        if (data.userMessage && data.aiMessage) {
          // AI conversation
          dispatch({ type: 'ADD_MESSAGE', payload: data.userMessage });
          dispatch({ type: 'ADD_MESSAGE', payload: data.aiMessage });
        } else {
          dispatch({ type: 'ADD_MESSAGE', payload: data });
        }
      });

      socket.on('messageRead', (data) => {
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            _id: data.messageId,
            isRead: true,
            readAt: data.readAt
          }
        });
      });

      return () => {
        socket.off('newMessage');
        socket.off('messageReceived');
        socket.off('messageRead');
      };
    }
  }, [socket]);

  const fetchConversations = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/conversations`);
      dispatch({ type: 'SET_CONVERSATIONS', payload: response.data.conversations });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/users`);
      dispatch({ type: 'SET_USERS', payload: response.data.users });
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const fetchMessages = async (userId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/messages/${userId}`);
      dispatch({ type: 'SET_MESSAGES', payload: response.data.messages });
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const sendMessage = async (content, receiver, messageType = 'user') => {
    try {
      const messageData = { content, receiver, messageType };
      
      if (socket) {
        socket.emit('sendMessage', messageData);
      } else {
        // Fallback to HTTP request
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/messages`, messageData);
        if (response.data.messages) {
          // AI response
          response.data.messages.forEach(msg => {
            dispatch({ type: 'ADD_MESSAGE', payload: msg });
          });
        } else {
          dispatch({ type: 'ADD_MESSAGE', payload: response.data.message });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const setActiveConversation = (conversation) => {
    dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: conversation });
    if (conversation) {
      fetchMessages(conversation._id === 'ai' ? 'ai' : conversation.participants.find(p => p._id !== user.id)?._id);
    }
  };

  const searchUsers = async (query) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/search?q=${query}`);
      return response.data.users;
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
      return [];
    }
  };

  const value = {
    ...state,
    fetchConversations,
    fetchUsers,
    fetchMessages,
    sendMessage,
    setActiveConversation,
    searchUsers
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
