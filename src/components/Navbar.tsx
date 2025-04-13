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
                className="w-12 h-12 rounded-full overflow-hidden hover:opacity-90 transition-opacity border-2 border-[#2A2A2A] hover:border-[#C1FF2F]"
              >
                {user ? (
                  <img
                    src={avatars[userAvatar as keyof typeof avatars] || avatars.Avatar1}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#2A2A2A] flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
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