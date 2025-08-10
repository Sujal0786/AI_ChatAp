import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import { Send, Smile, Paperclip, Phone, Video, MoreVertical, Bot } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';

const ChatWindow = () => {
  const { user } = useAuth();
  const { activeConversation, messages, sendMessage } = useChat();
  const { sendTyping, typingUsers } = useSocket();
  const [messageInput, setMessageInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    if (activeConversation && activeConversation._id !== 'ai') {
      const receiverId = activeConversation.participants.find(p => p._id !== user.id)?._id;
      
      if (!isTyping) {
        setIsTyping(true);
        sendTyping(receiverId, true);
      }

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        sendTyping(receiverId, false);
      }, 1000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !activeConversation) return;

    const content = messageInput.trim();
    setMessageInput('');

    if (activeConversation._id === 'ai') {
      await sendMessage(content, null, 'ai');
    } else {
      const receiverId = activeConversation.participants.find(p => p._id !== user.id)?._id;
      await sendMessage(content, receiverId, 'user');
    }

    // Clear typing indicator
    if (isTyping) {
      setIsTyping(false);
      const receiverId = activeConversation.participants.find(p => p._id !== user.id)?._id;
      sendTyping(receiverId, false);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setMessageInput(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const getConversationName = () => {
    if (!activeConversation) return '';
    if (activeConversation._id === 'ai') return 'AI Assistant';
    const otherUser = activeConversation.participants.find(p => p._id !== user.id);
    return otherUser?.username || 'Unknown User';
  };

  const isMessageFromMe = (message) => {
    return message.sender?._id === user.id || message.sender === user.id;
  };

  const formatMessageTime = (timestamp) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return format(messageDate, 'HH:mm');
    } else if (diffInHours < 48) {
      return 'Yesterday ' + format(messageDate, 'HH:mm');
    } else {
      return format(messageDate, 'MMM dd, HH:mm');
    }
  };

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to AI Chat</h3>
          <p className="text-gray-600 max-w-md">
            Select a conversation from the sidebar to start chatting, or search for users to begin a new conversation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              {activeConversation._id === 'ai' ? (
                <Bot className="h-6 w-6 text-blue-600" />
              ) : (
                <span className="text-gray-600 font-medium">
                  {getConversationName().charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{getConversationName()}</h3>
              <p className="text-sm text-gray-500">
                {activeConversation._id === 'ai' ? 'AI Assistant' : 'Online'}
              </p>
            </div>
          </div>
          
          {activeConversation._id !== 'ai' && (
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Phone className="h-5 w-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Video className="h-5 w-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <MoreVertical className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, index) => {
          const isFromMe = isMessageFromMe(message);
          const showAvatar = index === 0 || 
            messages[index - 1].sender?._id !== message.sender?._id ||
            messages[index - 1].sender !== message.sender;

          return (
            <div
              key={message._id || index}
              className={`flex ${isFromMe ? 'justify-end' : 'justify-start'} ${
                showAvatar ? 'mt-4' : 'mt-1'
              }`}
            >
              <div className={`flex max-w-xs lg:max-w-md ${isFromMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {showAvatar && !isFromMe && (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                    {message.messageType === 'ai' ? (
                      <Bot className="h-4 w-4 text-blue-600" />
                    ) : (
                      <span className="text-xs text-gray-600 font-medium">
                        {message.sender?.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                )}
                
                <div className={`px-4 py-2 rounded-lg ${
                  isFromMe 
                    ? 'bg-blue-600 text-white' 
                    : message.messageType === 'ai'
                    ? 'bg-gray-100 text-gray-900 border border-gray-200'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <div className={`flex items-center justify-end mt-1 space-x-1 ${
                    isFromMe ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    <span className="text-xs">
                      {formatMessageTime(message.createdAt)}
                    </span>
                    {isFromMe && message.messageType !== 'ai' && (
                      <div className="flex">
                        <span className="text-xs">
                          {message.isRead ? '✓✓' : message.isDelivered ? '✓' : '○'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {showAvatar && isFromMe && (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                    <span className="text-xs text-white font-medium">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {Array.from(typingUsers.values()).map(typingUser => (
          <div key={typingUser.userId} className="flex justify-start">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-xs text-gray-600 font-medium">
                  {typingUser.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="bg-gray-100 px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Smile className="h-5 w-5 text-gray-600" />
            </button>
            
            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 z-10">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>

          <button
            type="button"
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Paperclip className="h-5 w-5 text-gray-600" />
          </button>

          <div className="flex-1">
            <input
              type="text"
              value={messageInput}
              onChange={handleInputChange}
              placeholder={`Message ${getConversationName()}...`}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={!messageInput.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full transition-colors"
          >
            <Send className="h-5 w-5 text-white" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
