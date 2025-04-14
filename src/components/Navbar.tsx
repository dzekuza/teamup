import { FC, useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { CreateEventDialog } from './CreateEventDialog';
import { useClickOutside } from '../hooks/useClickOutside';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FriendRequestsMenu } from './FriendRequestsMenu';
import { NotificationsDropdown } from './NotificationsDropdown';
import Avatar1 from '../assets/avatars/Avatar1.png';
import Avatar2 from '../assets/avatars/Avatar2.png';
import Avatar3 from '../assets/avatars/Avatar3.png';
import Avatar4 from '../assets/avatars/Avatar4.png';
import LogoWhite from '../assets/images/logo-white.svg';

const avatars = {
  Avatar1,
  Avatar2,
  Avatar3,
  Avatar4,
};

export const Navbar: FC = () => {
  const { user, signOut } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string>('Avatar1');
  const profileMenuRef = useRef<HTMLDivElement>(null);

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

    loadUserAvatar();
  }, [user]);

  const closeProfileMenu = useCallback(() => {
    setShowProfileMenu(false);
  }, []);

  useClickOutside(profileMenuRef, closeProfileMenu);

  const handleEventCreated = () => {
    window.location.reload();
  };

  return (
    <nav className="bg-[#1E1E1E] border-b border-[#2A2A2A] sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center">
            <img src={LogoWhite} alt="WebPadel" className="h-8 w-auto" />
          </Link>

          <div className="flex items-center gap-6">
            {user && (
              <>
                <FriendRequestsMenu />
                <NotificationsDropdown />
                <button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="px-6 py-2.5 bg-[#C1FF2F] text-black rounded-xl font-medium hover:bg-[#B1EF1F] transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Create new event
                </button>
              </>
            )}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-3 focus:outline-none"
              >
                <div className="relative">
                  <img
                    src={avatars[userAvatar as keyof typeof avatars] || avatars.Avatar1}
                    alt="Profile"
                    className="h-8 w-8 rounded-full"
                  />
                  {user?.emailVerified && (
                    <div className="absolute -top-1 -right-1">
                      <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-[#1E1E1E] rounded-xl shadow-lg py-2 border border-[#2A2A2A]">
                  {user ? (
                    <>
                      <Link 
                        to="/profile" 
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#2A2A2A] hover:text-white"
                        onClick={closeProfileMenu}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          signOut();
                          closeProfileMenu();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#2A2A2A] hover:text-white"
                      >
                        Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#2A2A2A] hover:text-white"
                        onClick={closeProfileMenu}
                      >
                        Sign in
                      </Link>
                      <Link
                        to="/register"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#2A2A2A] hover:text-white"
                        onClick={closeProfileMenu}
                      >
                        Register
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CreateEventDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onEventCreated={handleEventCreated}
      />
    </nav>
  );
}; 