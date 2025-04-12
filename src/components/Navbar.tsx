import { FC, useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { CreateEventDialog } from './CreateEventDialog';
import { useClickOutside } from '../hooks/useClickOutside';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
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

export const Navbar: FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
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
    <nav className="bg-[#111111] py-4">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-white">
            <svg 
              width="32" 
              height="35" 
              viewBox="0 0 224 246" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="text-[#C1FF2F]"
            >
              <path 
                d="M88.2084 161.616L70.587 216.156C93.4539 213.054 118.455 217.226 141.222 215.265C167.505 213.004 166.198 189.739 173.932 172.148C180.967 156.138 202.618 161.386 202.563 176.801C202.548 181.259 197.038 198.655 195.213 203.688C185.585 230.28 164.313 243.303 136.615 244.909C113.229 246.265 61.3624 247.386 40.126 241.617C3.6666 231.716 -11.6312 189.864 9.81963 158.429C22.8188 139.387 45.3715 133.358 66.9819 130.381C77.124 104.235 83.267 74.3707 94.4063 48.8295C102.314 30.693 116.411 13.8323 134.939 6.15243C201.137 -21.275 250.062 48.5944 208.846 105.315C181.685 142.689 133.608 161.886 88.2034 161.611L88.2084 161.616ZM99.1931 130.031C128.776 129.125 159.492 117.653 179.038 94.8587C219.077 48.1641 165.166 5.34691 131.943 45.7526C127.221 51.4912 123.446 59.041 120.634 65.8903C112.247 86.3383 106.737 109.168 99.1931 130.031ZM56.7302 162.452C32.7065 164.603 19.6625 192.831 39.6723 209.672L56.7302 162.452Z" 
                fill="currentColor"
              />
            </svg>
          </Link>
          <div className="flex items-center gap-4">
            {user && (
              <button
                onClick={() => setIsCreateDialogOpen(true)}
                className="px-4 py-2 bg-[#C1FF2F] text-black rounded-xl font-medium hover:bg-[#B1EF1F] transition-colors"
              >
                Create new event
              </button>
            )}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-10 h-10 rounded-full overflow-hidden hover:opacity-90 transition-opacity"
              >
                {user ? (
                  <img
                    src={avatars[userAvatar as keyof typeof avatars] || avatars.Avatar1}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white" />
                )}
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-[#1E1E1E] rounded-xl shadow-lg py-2">
                  {user ? (
                    <>
                      <Link 
                        to="/profile" 
                        className="block px-4 py-2 text-white hover:bg-[#2A2A2A]"
                        onClick={closeProfileMenu}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          signOut();
                          closeProfileMenu();
                        }}
                        className="block w-full text-left px-4 py-2 text-white hover:bg-[#2A2A2A]"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link 
                        to="/login" 
                        className="block px-4 py-2 text-white hover:bg-[#2A2A2A]"
                        onClick={closeProfileMenu}
                      >
                        Login
                      </Link>
                      <Link 
                        to="/register" 
                        className="block px-4 py-2 text-white hover:bg-[#2A2A2A]"
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