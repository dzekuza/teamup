import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { CreateEventDialog } from './CreateEventDialog';
import Avatar1 from '../assets/avatars/Avatar1.png';
import Avatar2 from '../assets/avatars/Avatar2.png';
import Avatar3 from '../assets/avatars/Avatar3.png';
import Avatar4 from '../assets/avatars/Avatar4.png';
import { UserProfileDialog } from './UserProfileDialog';
import { Bookmark } from '@mui/icons-material';

const avatars = {
  Avatar1,
  Avatar2,
  Avatar3,
  Avatar4,
};

export const MobileNavigation: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string>('Avatar1');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const loadUserAvatar = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserAvatar(userData.photoURL || 'Avatar1');
        }
      }
    };

    // Fetch unread notifications count
    const fetchNotificationsCount = async () => {
      if (!user) return;
      
      try {
        const notificationsQuery = query(
          collection(db, 'notifications'),
          where('userId', '==', user.uid),
          where('read', '==', false)
        );
        
        const snapshot = await getDocs(notificationsQuery);
        setUnreadNotifications(snapshot.docs.length);
      } catch (error) {
        console.error('Error fetching unread notifications:', error);
      }
    };

    loadUserAvatar();
    fetchNotificationsCount();
    
    // Set up interval to refresh notifications count every minute
    const interval = setInterval(() => {
      fetchNotificationsCount();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Listen for the custom event to hide navigation
  useEffect(() => {
    const handleToggleNavigation = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.hide === 'boolean') {
        setIsHidden(customEvent.detail.hide);
      }
    };

    window.addEventListener('toggleNavigation', handleToggleNavigation);
    
    return () => {
      window.removeEventListener('toggleNavigation', handleToggleNavigation);
    };
  }, []);

  const handleEventCreated = () => {
    window.location.reload();
  };

  // If user is not logged in or navigation is hidden, don't show mobile navigation
  if (!user || isHidden) return null;

  return (
    <>
      {/* Create Event Button - Above the navigation */}
      <div className="fixed bottom-[88px] left-0 right-0 flex justify-center z-40">
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-[#C1FF2F] text-black rounded-full px-8 py-3 font-semibold shadow-lg"
        >
          Create
        </button>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-[#2A2A2A] py-2 z-40 fixed-bottom-navigation">
        <div className="flex justify-around items-center h-16">
          {/* Explore */}
          <Link to="/" className="flex flex-col items-center space-y-1">
            <div className={`p-1 rounded-full ${location.pathname === '/' ? 'text-[#C1FF2F]' : 'text-gray-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <span className={`text-xs ${location.pathname === '/' ? 'text-[#C1FF2F]' : 'text-gray-400'}`}>Explore</span>
          </Link>

          {/* Events */}
          <Link to="/my-events" className="flex flex-col items-center space-y-1">
            <div className={`p-1 rounded-full ${location.pathname === '/my-events' ? 'text-[#C1FF2F]' : 'text-gray-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className={`text-xs ${location.pathname === '/my-events' ? 'text-[#C1FF2F]' : 'text-gray-400'}`}>Events</span>
          </Link>

          {/* Notifications */}
          <Link to="/notifications" className="flex flex-col items-center space-y-1 relative">
            <div className={`p-1 rounded-full ${location.pathname === '/notifications' ? 'text-[#C1FF2F]' : 'text-gray-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </div>
            <span className={`text-xs ${location.pathname === '/notifications' ? 'text-[#C1FF2F]' : 'text-gray-400'}`}>Notifications</span>
          </Link>

          {/* Community */}
          <Link to="/community" className="flex flex-col items-center space-y-1">
            <div className={`p-1 rounded-full ${location.pathname === '/community' ? 'text-[#C1FF2F]' : 'text-gray-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className={`text-xs ${location.pathname === '/community' ? 'text-[#C1FF2F]' : 'text-gray-400'}`}>Community</span>
          </Link>

          {/* Saved Events - New Item */}
          <Link to="/saved-events" className="flex flex-col items-center space-y-1">
            <div className={`p-1 rounded-full ${location.pathname === '/saved-events' ? 'text-[#C1FF2F]' : 'text-gray-400'}`}>
              <Bookmark className="h-6 w-6" />
            </div>
            <span className={`text-xs ${location.pathname === '/saved-events' ? 'text-[#C1FF2F]' : 'text-gray-400'}`}>Saved</span>
          </Link>

          {/* Profile */}
          <button 
            onClick={() => setIsProfileDialogOpen(true)}
            className="flex flex-col items-center space-y-1"
          >
            <div className="relative">
              <img
                src={avatars[userAvatar as keyof typeof avatars] || avatars.Avatar1}
                alt="Profile"
                className="h-7 w-7 rounded-full border-2 border-gray-700"
              />
              {user?.emailVerified && (
                <div className="absolute -top-1 -right-1">
                  <svg className="h-3 w-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <span className="text-xs text-gray-400">Profile</span>
          </button>
        </div>
      </div>

      {/* Dialogs */}
      <CreateEventDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onEventCreated={handleEventCreated}
      />

      <UserProfileDialog
        userId={user.uid}
        open={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
      />
    </>
  );
}; 