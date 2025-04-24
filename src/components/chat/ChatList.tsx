import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Avatar } from '@mui/material';
import { format } from 'date-fns';

interface Chat {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: any;
  lastMessageSender: string;
  unreadCount: { [key: string]: number };
}

interface ChatListProps {
  onChatSelect: (chatId: string, otherUser: any) => void;
  selectedChatId?: string;
}

export const ChatList: React.FC<ChatListProps> = ({ onChatSelect, selectedChatId }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [participantDetails, setParticipantDetails] = useState<{[key: string]: any}>({});

  useEffect(() => {
    if (!user) return;

    // Subscribe to chats where the current user is a participant
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chat[];

      // Fetch participant details for each chat
      const participantPromises = chatsData.flatMap(chat => 
        chat.participants
          .filter(participantId => participantId !== user.uid)
          .map(async participantId => {
            if (!participantDetails[participantId]) {
              const userDoc = await getDoc(doc(db, 'users', participantId));
              if (userDoc.exists()) {
                return { [participantId]: userDoc.data() };
              }
            }
            return null;
          })
      );

      const participantResults = await Promise.all(participantPromises);
      const newParticipantDetails = participantResults.reduce((acc, curr) => {
        if (curr) {
          return { ...acc, ...curr };
        }
        return acc;
      }, {});

      setParticipantDetails(prev => ({ ...prev, ...newParticipantDetails }));
      setChats(chatsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getOtherParticipant = (chat: Chat) => {
    const otherParticipantId = chat.participants.find(id => id !== user?.uid);
    return otherParticipantId ? participantDetails[otherParticipantId] : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#C1FF2F]"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1A1A] h-full">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white">Messages</h2>
      </div>
      <div className="divide-y divide-gray-800">
        {chats.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            No conversations yet
          </div>
        ) : (
          chats.map(chat => {
            const otherParticipant = getOtherParticipant(chat);
            if (!otherParticipant) return null;

            return (
              <div
                key={chat.id}
                onClick={() => onChatSelect(chat.id, {
                  id: chat.participants.find(id => id !== user?.uid),
                  ...otherParticipant
                })}
                className={`p-4 cursor-pointer hover:bg-[#2A2A2A] transition-colors ${
                  selectedChatId === chat.id ? 'bg-[#2A2A2A]' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Avatar
                    src={otherParticipant.photoURL}
                    alt={otherParticipant.displayName}
                    sx={{ width: 48, height: 48, bgcolor: '#333' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="text-white font-medium truncate">
                        {otherParticipant.displayName}
                      </h3>
                      {chat.lastMessageTime && (
                        <span className="text-xs text-gray-400">
                          {format(chat.lastMessageTime.toDate(), 'HH:mm')}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm truncate">
                      {chat.lastMessageSender === user?.uid ? 'You: ' : ''}
                      {chat.lastMessage}
                    </p>
                    {chat.unreadCount?.[user?.uid || ''] > 0 && (
                      <span className="inline-flex items-center justify-center bg-[#C1FF2F] text-black rounded-full w-5 h-5 text-xs font-medium mt-1">
                        {chat.unreadCount[user?.uid || '']}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList; 