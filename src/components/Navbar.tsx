import { FC } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const Navbar: FC = () => {
  const { user, signOut } = useAuth();

  return (
    <nav className="bg-[#1a1a1a] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <svg 
                width="32" 
                height="35" 
                viewBox="0 0 224 246" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                <path 
                  d="M88.2084 161.616L70.587 216.156C93.4539 213.054 118.455 217.226 141.222 215.265C167.505 213.004 166.198 189.739 173.932 172.148C180.967 156.138 202.618 161.386 202.563 176.801C202.548 181.259 197.038 198.655 195.213 203.688C185.585 230.28 164.313 243.303 136.615 244.909C113.229 246.265 61.3624 247.386 40.126 241.617C3.6666 231.716 -11.6312 189.864 9.81963 158.429C22.8188 139.387 45.3715 133.358 66.9819 130.381C77.124 104.235 83.267 74.3707 94.4063 48.8295C102.314 30.693 116.411 13.8323 134.939 6.15243C201.137 -21.275 250.062 48.5944 208.846 105.315C181.685 142.689 133.608 161.886 88.2034 161.611L88.2084 161.616ZM99.1931 130.031C128.776 129.125 159.492 117.653 179.038 94.8587C219.077 48.1641 165.166 5.34691 131.943 45.7526C127.221 51.4912 123.446 59.041 120.634 65.8903C112.247 86.3383 106.737 109.168 99.1931 130.031ZM56.7302 162.452C32.7065 164.603 19.6625 192.831 39.6723 209.672L56.7302 162.452Z" 
                  fill="currentColor"
                />
              </svg>
              <span className="text-xl font-bold">WebPadel</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link 
                  to="/create" 
                  className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-[#2a2a2a] transition-colors"
                >
                  Create Event
                </Link>
                <Link 
                  to="/profile" 
                  className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-[#2a2a2a] transition-colors"
                >
                  Profile
                </Link>
                <button
                  onClick={signOut}
                  className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-[#2a2a2a] transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-[#2a2a2a] transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-[#2a2a2a] transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}; 