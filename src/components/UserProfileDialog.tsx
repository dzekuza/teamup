import React, { useEffect, useState, useRef } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Event } from '../types';
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

export const UserProfileDialog: React.FC<UserProfileDialogProps> = ({
  userId,
  open,
  onClose,
}) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!open) return;
      
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
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, open]);

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
        className="bg-[#1E1E1E] rounded-3xl w-full max-w-md max-h-[50vh] flex flex-col relative"
      >
        {loading ? (
          <div className="text-white text-center p-8">Loading...</div>
        ) : userProfile ? (
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
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

                <div className="space-y-4 mb-6">
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

                <div className="border-t border-[#2A2A2A] pt-6">
                  <h3 className="text-white font-medium mb-4">Created Events</h3>
                  {userEvents.length > 0 ? (
                    <div className="space-y-4 pb-20">
                      {userEvents.map(event => (
                        <div
                          key={event.id}
                          className="bg-[#2A2A2A] rounded-xl p-4"
                        >
                          <h4 className="text-white font-medium">{event.title}</h4>
                          <p className="text-gray-400 text-sm">
                            {event.date} at {event.time}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {event.location} • {event.level}
                          </p>
                          <div className="mt-2 text-[#C1FF2F]">
                            {event.currentPlayers}/{event.maxPlayers} players
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No events created yet</p>
                  )}
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#1E1E1E] border-t border-[#2A2A2A]">
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-[#2A2A2A] text-white rounded-xl hover:bg-[#3A3A3A] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-white text-center p-8">User not found</div>
        )}
      </div>
    </div>
  );
}; 