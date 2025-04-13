import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc, arrayUnion, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import Avatar1 from '../assets/avatars/Avatar1.png';
import Avatar2 from '../assets/avatars/Avatar2.png';
import Avatar3 from '../assets/avatars/Avatar3.png';
import Avatar4 from '../assets/avatars/Avatar4.png';

const avatars = {
  Avatar1,
  Avatar2,
  Avatar3,
  Avatar4,
};

interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  timestamp: string;
  fromUser?: {
    displayName?: string;
    email?: string;
    photoURL: string;
  };
}

export const FriendRequestsMenu: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const requestsQuery = query(
      collection(db, `friends/${user.uid}/requests`),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(requestsQuery, async (snapshot) => {
      const requestsData: FriendRequest[] = [];
      
      for (const docSnapshot of snapshot.docs) {
        const request = { id: docSnapshot.id, ...docSnapshot.data() } as FriendRequest;
        
        // Fetch user data for each request
        const userDoc = await getDoc(doc(db, 'users', request.fromUserId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          request.fromUser = {
            displayName: userData.displayName,
            email: userData.email,
            photoURL: userData.photoURL
          };
        }
        
        requestsData.push(request);
      }
      
      setRequests(requestsData);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAcceptRequest = async (request: FriendRequest) => {
    if (!user) return;

    try {
      // Add to both users' friend lists
      const userFriendsRef = doc(db, 'friends', user.uid);
      const targetFriendsRef = doc(db, 'friends', request.fromUserId);

      // First check if the friends document exists, if not create it
      const userFriendsDoc = await getDoc(userFriendsRef);
      if (!userFriendsDoc.exists()) {
        // Create the document if it doesn't exist
        await setDoc(userFriendsRef, {
          friends: [request.fromUserId]
        });
      } else {
        await updateDoc(userFriendsRef, {
          friends: arrayUnion(request.fromUserId)
        });
      }

      // Check if the other user's friends document exists
      const targetFriendsDoc = await getDoc(targetFriendsRef);
      if (!targetFriendsDoc.exists()) {
        // Create the document if it doesn't exist
        await setDoc(targetFriendsRef, {
          friends: [user.uid]
        });
      } else {
        await updateDoc(targetFriendsRef, {
          friends: arrayUnion(user.uid)
        });
      }

      // Delete the friend request
      await deleteDoc(doc(db, `friends/${user.uid}/requests`, request.id));
      
      // Close the menu after accepting
      setIsOpen(false);
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleRejectRequest = async (request: FriendRequest) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, `friends/${user.uid}/requests`, request.id));
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  if (!user || requests.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white hover:bg-[#2A2A2A] rounded-xl transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        <span className="absolute top-0 right-0 bg-[#C1FF2F] text-black text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {requests.length}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#1E1E1E] rounded-xl shadow-lg py-2 z-50">
          <div className="px-4 py-2 border-b border-[#2A2A2A]">
            <h3 className="text-white font-medium">Friend Requests</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {requests.map((request) => (
              <div
                key={request.id}
                className="px-4 py-3 hover:bg-[#2A2A2A] flex items-center gap-3"
              >
                <img
                  src={avatars[request.fromUser?.photoURL as keyof typeof avatars] || avatars.Avatar1}
                  alt="Profile"
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <p className="text-white">
                    {request.fromUser?.displayName || request.fromUser?.email || 'Unknown User'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {new Date(request.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptRequest(request)}
                    className="p-2 text-[#C1FF2F] hover:bg-[#2A2A2A] rounded-lg transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request)}
                    className="p-2 text-red-500 hover:bg-[#2A2A2A] rounded-lg transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 