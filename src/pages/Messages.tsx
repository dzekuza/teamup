import React, { useState, useEffect } from 'react';
import { ChatList } from '../components/chat/ChatList';
import { ChatWindow } from '../components/chat/ChatWindow';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface ChatEvent extends CustomEvent {
  detail: {
    chatId: string;
    otherUser: {
      id: string;
      displayName: string;
      photoURL?: string;
    };
  };
}

export const Messages: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedChat, setSelectedChat] = useState<{
    chatId: string;
    otherUser: {
      id: string;
      displayName: string;
      photoURL?: string;
    };
  } | null>(null);

  // Handle auth redirect
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Handle chat opening from URL params or custom event
  useEffect(() => {
    const handleOpenChat = (event: Event) => {
      const chatEvent = event as ChatEvent;
      console.log('Opening chat:', chatEvent.detail);
      setSelectedChat({
        chatId: chatEvent.detail.chatId,
        otherUser: chatEvent.detail.otherUser
      });
    };

    window.addEventListener('openChat', handleOpenChat);

    return () => {
      window.removeEventListener('openChat', handleOpenChat);
    };
  }, []);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-[#1A1A1A] rounded-xl overflow-hidden shadow-xl min-h-[80vh]">
          <div className="grid grid-cols-1 md:grid-cols-3 h-[80vh]">
            {/* Chat List */}
            <div className="md:col-span-1 border-r border-gray-800">
              <ChatList
                onChatSelect={(chatId, otherUser) => {
                  console.log('Selected chat:', chatId, otherUser);
                  setSelectedChat({ chatId, otherUser });
                }}
                selectedChatId={selectedChat?.chatId}
              />
            </div>

            {/* Chat Window */}
            <div className="md:col-span-2">
              {selectedChat ? (
                <ChatWindow
                  chatId={selectedChat.chatId}
                  otherUser={selectedChat.otherUser}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Select a conversation to start messaging
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages; 