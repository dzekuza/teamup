import React, { useEffect, useState, useRef } from 'react';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { Event } from '../types/index';
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

interface UserProfileDialogProps {
  userId: string;
  open: boolean;
  onClose: () => void;
}

interface UserProfile {
  displayName: string;
  photoURL: string;
  email: string;
  phoneNumber?: string;
  level?: string;
}

type FriendStatus = 'none' | 'pending' | 'friends';

interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: string;
  timestamp: string;
  fromUser?: {
    displayName: string;
    photoURL: string;
  };
}

export const UserProfileDialog: React.FC<UserProfileDialogProps> = ({
  userId,
  open,
  onClose,
}) => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>('none');
  const [activeTab, setActiveTab] = useState<'profile' | 'friends' | 'games'>('profile');
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!open || !user) return;
      
      setLoading(true);
      try {
        // Fetch user profile
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        }

        // Fetch user's created events
        const eventsQuery = query(
          collection(db, 'events'),
          where('createdBy', '==', userId)
        );
        const eventsSnapshot = await getDocs(eventsQuery);
        const events = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Event[];
        
        setUserEvents(events);

        // Check friend status
        const friendsDoc = await getDoc(doc(db, 'friends', user.uid));
        if (friendsDoc.exists()) {
          const friendsData = friendsDoc.data();
          if (friendsData.friends?.includes(userId)) {
            setFriendStatus('friends');
          } else {
            // Check for pending friend request
            const requestsQuery = query(
              collection(db, `friends/${user.uid}/requests`),
              where('fromUserId', '==', userId)
            );
            const requestsSnapshot = await getDocs(requestsQuery);
            if (!requestsSnapshot.empty) {
              setFriendStatus('pending');
            }
          }
        }

        // Fetch friend requests only if viewing own profile
        if (userId === user.uid) {
          // Fetch friend requests
          const incomingRequestsQuery = query(
            collection(db, `friends/${user.uid}/requests`),
            where('status', '==', 'pending')
          );
          const incomingRequestsSnapshot = await getDocs(incomingRequestsQuery);
          const requests: FriendRequest[] = [];
          
          for (const docSnapshot of incomingRequestsSnapshot.docs) {
            const requestData = docSnapshot.data() as FriendRequest;
            const fromUserDoc = await getDoc(doc(db, 'users', requestData.fromUserId));
            if (fromUserDoc.exists()) {
              const fromUserData = fromUserDoc.data() as { displayName: string; photoURL: string };
              requests.push({
                ...requestData,
                id: docSnapshot.id,
                fromUser: {
                  displayName: fromUserData.displayName,
                  photoURL: fromUserData.photoURL
                }
              });
            }
          }
          
          setFriendRequests(requests);
        }

        // Fetch friends list for the profile being viewed
        const profileFriendsDoc = await getDoc(doc(db, 'friends', userId));
        if (profileFriendsDoc.exists()) {
          const friendsData = profileFriendsDoc.data();
          setFriends(friendsData.friends || []);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, open, user]);

  const handleSendFriendRequest = async () => {
    if (!user || !userProfile) return;

    try {
      await addDoc(collection(db, `friends/${userId}/requests`), {
        fromUserId: user.uid,
        toUserId: userId,
        status: 'pending',
        timestamp: new Date().toISOString()
      });
      setFriendStatus('pending');
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleAcceptFriendRequest = async (requestId: string, fromUserId: string) => {
    if (!user) return;

    try {
      // Verify this request is actually for the current user
      if (userId !== user.uid) {
        console.error('Cannot accept a friend request when viewing another user\'s profile');
        return;
      }

      // Add to both users' friend lists
      const userFriendsRef = doc(db, 'friends', user.uid);
      const targetFriendsRef = doc(db, 'friends', fromUserId);

      // First check if the friends document exists, if not create it
      const userFriendsDoc = await getDoc(userFriendsRef);
      if (!userFriendsDoc.exists()) {
        await updateDoc(userFriendsRef, {
          friends: [fromUserId]
        });
      } else {
        await updateDoc(userFriendsRef, {
          friends: arrayUnion(fromUserId)
        });
      }

      // Check if the other user's friends document exists
      const targetFriendsDoc = await getDoc(targetFriendsRef);
      if (!targetFriendsDoc.exists()) {
        await updateDoc(targetFriendsRef, {
          friends: [user.uid]
        });
      } else {
        await updateDoc(targetFriendsRef, {
          friends: arrayUnion(user.uid)
        });
      }

      // Delete the friend request
      await deleteDoc(doc(db, `friends/${user.uid}/requests`, requestId));
      
      // Update local state
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
      setFriends(prev => [...prev, fromUserId]);
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleRejectFriendRequest = async (requestId: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, `friends/${user.uid}/requests`, requestId));
      
      // Update local state
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div 
        ref={dialogRef}
        className="bg-[#1E1E1E] rounded-3xl w-full max-w-4xl max-h-[80vh] flex flex-col relative"
      >
        {loading ? (
          <div className="text-white text-center p-8">Loading...</div>
        ) : userProfile ? (
          <>
            <div className="p-6 border-b border-[#2A2A2A]">
              <div className="flex items-center gap-4">
                <img
                  src={avatars[userProfile.photoURL as keyof typeof avatars] || avatars.Avatar1}
                  alt="Profile Avatar"
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <h2 className="text-xl font-medium text-white">
                    {userProfile.displayName}
                  </h2>
                  <p className="text-gray-400 text-sm">{userProfile.email}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#2A2A2A]">
              <button
                className={`flex-1 py-3 text-center font-medium transition-colors ${
                  activeTab === 'profile' 
                    ? 'text-[#C1FF2F] border-b-2 border-[#C1FF2F]' 
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('profile')}
              >
                Profile
              </button>
              <button
                className={`flex-1 py-3 text-center font-medium transition-colors ${
                  activeTab === 'friends' 
                    ? 'text-[#C1FF2F] border-b-2 border-[#C1FF2F]' 
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('friends')}
              >
                Friends
              </button>
              <button
                className={`flex-1 py-3 text-center font-medium transition-colors ${
                  activeTab === 'games' 
                    ? 'text-[#C1FF2F] border-b-2 border-[#C1FF2F]' 
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('games')}
              >
                Games
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Friend Status and Actions */}
                  {user && user.uid !== userId && (
                    <div className="mb-6">
                      {friendStatus === 'none' && (
                        <button
                          onClick={handleSendFriendRequest}
                          className="w-full bg-[#C1FF2F] text-black rounded-xl py-2 font-medium hover:bg-[#B1EF1F] transition-colors"
                        >
                          Add Friend
                        </button>
                      )}
                      {friendStatus === 'pending' && (
                        <div className="text-[#C1FF2F] text-center py-2">
                          Friend Request Sent
                        </div>
                      )}
                      {friendStatus === 'friends' && (
                        <div className="text-[#C1FF2F] text-center py-2">
                          Friends
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-4">
                    {userProfile.level && (
                      <div>
                        <h3 className="text-gray-400 text-sm">Level</h3>
                        <p className="text-white">{userProfile.level}</p>
                      </div>
                    )}
                    {userProfile.phoneNumber && (
                      <div>
                        <h3 className="text-gray-400 text-sm">Phone</h3>
                        <p className="text-white">{userProfile.phoneNumber}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Friends Tab */}
              {activeTab === 'friends' && (
                <div className="space-y-6">
                  {/* Friend Requests */}
                  <div>
                    <h3 className="text-white font-medium mb-4">Friend Requests</h3>
                    {friendRequests.length > 0 ? (
                      <div className="space-y-3">
                        {friendRequests.map(request => (
                          <div key={request.id} className="bg-[#2A2A2A] rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img
                                src={avatars[request.fromUser?.photoURL as keyof typeof avatars] || avatars.Avatar1}
                                alt="Avatar"
                                className="w-10 h-10 rounded-full"
                              />
                              <div>
                                <p className="text-white font-medium">{request.fromUser?.displayName}</p>
                                <p className="text-gray-400 text-sm">
                                  {new Date(request.timestamp).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptFriendRequest(request.id, request.fromUserId)}
                                className="px-4 py-1.5 bg-[#C1FF2F] text-black rounded-lg font-medium hover:bg-[#B1EF1F] transition-colors"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectFriendRequest(request.id)}
                                className="px-4 py-1.5 bg-[#2A2A2A] text-white rounded-lg font-medium hover:bg-[#3A3A3A] transition-colors"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400">No pending friend requests</p>
                    )}
                  </div>

                  {/* Friends List */}
                  <div>
                    <h3 className="text-white font-medium mb-4">Friends</h3>
                    {friends.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {friends.map(friendId => (
                          <div key={friendId} className="bg-[#2A2A2A] rounded-xl p-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#3A3A3A]"></div>
                            <p className="text-white">Friend {friendId.substring(0, 5)}...</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400">No friends yet</p>
                    )}
                  </div>
                </div>
              )}

              {/* Games Tab */}
              {activeTab === 'games' && (
                <div>
                  <h3 className="text-white font-medium mb-4">Created Events</h3>
                  {userEvents.length > 0 ? (
                    <div className="space-y-4">
                      {userEvents.map(event => (
                        <div
                          key={event.id}
                          className="bg-[#2A2A2A] rounded-xl p-4"
                        >
                          <h4 className="text-white font-medium">{event.title}</h4>
                          <p className="text-gray-400 text-sm">
                            {new Date(event.date).toLocaleDateString()} at {event.time}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {event.location} • {event.level}
                          </p>
                          <div className="mt-2 text-[#C1FF2F]">
                            {event.players.length}/{event.maxPlayers} players
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No events created yet</p>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#2A2A2A] flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#2A2A2A] text-white rounded-xl hover:bg-[#3A3A3A] transition-colors"
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <div className="text-white text-center p-8">User not found</div>
        )}
      </div>
    </div>
  );
}; 