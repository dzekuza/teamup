import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../types';

interface FriendSearchProps {
  userFriends: string[];
  selectedFriends: string[];
  onToggleFriend: (friendId: string) => void;
}

export const FriendSearch: React.FC<FriendSearchProps> = ({
  userFriends,
  selectedFriends,
  onToggleFriend,
}) => {
  const [friends, setFriends] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchFriends = async () => {
      if (!userFriends.length) return;

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('id', 'in', userFriends));
      const querySnapshot = await getDocs(q);
      
      const friendsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
      
      setFriends(friendsData);
    };

    fetchFriends();
  }, [userFriends]);

  const filteredFriends = friends.filter(friend =>
    friend.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Search friends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 pl-8 bg-[#2A2A2A] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <svg
          className="absolute left-2 top-2.5 h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredFriends.map(friend => (
          <button
            key={friend.id}
            onClick={() => onToggleFriend(friend.id)}
            className={`p-4 rounded-xl transition-colors ${
              selectedFriends.includes(friend.id)
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-[#2A2A2A] hover:bg-[#3A3A3A]'
            }`}
          >
            <div className="flex items-center space-x-3">
              {friend.photoURL && (
                <img
                  src={friend.photoURL}
                  alt={friend.displayName || 'Friend'}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div className="text-left">
                <p className="font-medium">{friend.displayName}</p>
                <p className="text-sm text-gray-400">{friend.email}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}; 