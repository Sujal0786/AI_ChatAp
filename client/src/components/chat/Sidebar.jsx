import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import { Search, Settings, LogOut, MessageCircle, Bot, Users, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { conversations, activeConversation, setActiveConversation, users, searchUsers } = useChat();
  const { onlineUsers } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = await searchUsers(query);
      setSearchResults(results);
      setShowSearch(true);
    } else {
      setSearchResults([]);
      setShowSearch(false);
    }
  };

  const handleUserSelect = (selectedUser) => {
    // Create a temporary conversation object for new chat
    const newConversation = {
      _id: selectedUser._id,
      participants: [selectedUser],
      lastMessage: null,
      lastMessageTime: new Date(),
      isAIConversation: false
    };
    setActiveConversation(newConversation);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const getConversationName = (conversation) => {
    if (conversation._id === 'ai') return 'AI Assistant';
    const otherUser = conversation.participants.find(p => p._id !== user.id);
    return otherUser?.username || 'Unknown User';
  };

  const getConversationAvatar = (conversation) => {
    if (conversation._id === 'ai') return '🤖';
    const otherUser = conversation.participants.find(p => p._id !== user.id);
    return otherUser?.avatar || '👤';
  };

  const isUserOnline = (userId) => {
    if (userId === 'ai') return true;
    return onlineUsers.get(userId)?.isOnline || false;
  };

  const getLastMessageTime = (conversation) => {
    if (!conversation.lastMessageTime) return '';
    return formatDistanceToNow(new Date(conversation.lastMessageTime), { addSuffix: true });
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{user?.username}</h3>
              <p className="text-sm text-green-600">Online</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Settings className="h-5 w-5 text-gray-600" />
            </button>
            <button 
              onClick={logout}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <LogOut className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Search Results */}
        {showSearch && searchResults.length > 0 && (
          <div className="absolute z-10 w-72 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((user) => (
              <button
                key={user._id}
                onClick={() => handleUserSelect(user)}
                className="w-full p-3 hover:bg-gray-50 flex items-center space-x-3 text-left"
              >
                <div className="relative">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {isUserOnline(user._id) && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user.username}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Conversations
          </h4>
        </div>

        <div className="space-y-1">
          {conversations.map((conversation) => {
            const isActive = activeConversation?._id === conversation._id;
            const conversationName = getConversationName(conversation);
            const conversationAvatar = getConversationAvatar(conversation);
            const isOnline = isUserOnline(conversation._id === 'ai' ? 'ai' : conversation.participants.find(p => p._id !== user.id)?._id);

            return (
              <button
                key={conversation._id}
                onClick={() => setActiveConversation(conversation)}
                className={`w-full p-3 hover:bg-gray-50 flex items-center space-x-3 text-left transition-colors ${
                  isActive ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-lg">
                    {conversation._id === 'ai' ? (
                      <Bot className="h-6 w-6 text-blue-600" />
                    ) : (
                      <span className="text-gray-600 font-medium">
                        {conversationName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {isOnline && conversation._id !== 'ai' && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 truncate">
                      {conversationName}
                    </p>
                    <span className="text-xs text-gray-500">
                      {getLastMessageTime(conversation)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {conversation.lastMessage?.content || 
                     (conversation._id === 'ai' ? 'Start chatting with AI' : 'Start a conversation')}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
