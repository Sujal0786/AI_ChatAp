import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import { Loader2 } from 'lucide-react';

const ChatLayout = () => {
  const { user } = useAuth();
  const { loading, fetchConversations, fetchUsers } = useChat();

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchUsers();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar />
      <ChatWindow />
    </div>
  );
};

export default ChatLayout;
