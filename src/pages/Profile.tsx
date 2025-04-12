import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { AvatarSelector } from '../components/AvatarSelector';
import Avatar1 from '../assets/avatars/Avatar1.png';
import Avatar2 from '../assets/avatars/Avatar2.png';
import Avatar3 from '../assets/avatars/Avatar3.png';
import Avatar4 from '../assets/avatars/Avatar4.png';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const avatars = {
  Avatar1,
  Avatar2,
  Avatar3,
  Avatar4,
};

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [level, setLevel] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('Avatar1');

  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        setDisplayName(user.displayName || '');
        setEmail(user.email || '');
        
        // Load user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setSelectedAvatar(userData.photoURL || 'Avatar1');
          setPhoneNumber(userData.phoneNumber || '');
          setLevel(userData.level || '');
        }
      }
    };

    loadUserData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser!, {
        displayName: displayName,
        photoURL: selectedAvatar
      });

      // Update Firestore user document
      await setDoc(doc(db, 'users', user.uid), {
        displayName,
        email: user.email,
        photoURL: selectedAvatar,
        phoneNumber,
        level,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setSuccess('Profile updated successfully!');
    } catch (error) {
      setError('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSelect = async (avatarId: string) => {
    setSelectedAvatar(avatarId);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      setError('Failed to log out.');
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="bg-[#1E1E1E] rounded-3xl p-8">
          <div className="flex flex-col items-center mb-8">
            <button
              onClick={() => setShowAvatarSelector(true)}
              className="relative w-24 h-24 rounded-full overflow-hidden hover:ring-2 hover:ring-[#C1FF2F] transition-all mb-4"
            >
              <img
                src={avatars[selectedAvatar as keyof typeof avatars]}
                alt="Profile Avatar"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
                <span className="text-white opacity-0 hover:opacity-100">Change</span>
              </div>
            </button>
            <h1 className="text-2xl font-medium text-white">Profile</h1>
          </div>

          {error && (
            <div className="text-red-500 text-sm mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="text-[#C1FF2F] text-sm mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Display Name</label>
              <input
                type="text"
                placeholder="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full bg-[#2A2A2A] text-gray-400 rounded-xl p-3"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Phone Number</label>
              <input
                type="tel"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Game Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F] appearance-none"
              >
                <option value="">Select your level</option>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C1FF2F] text-black rounded-xl py-3 font-medium hover:bg-[#B1EF1F] transition-colors disabled:opacity-50"
            >
              Update Profile
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-[#2A2A2A]">
            <button
              onClick={handleLogout}
              className="w-full bg-transparent border border-red-500 text-red-500 rounded-xl py-3 hover:bg-red-500 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {showAvatarSelector && (
        <AvatarSelector
          selectedAvatar={selectedAvatar}
          onSelect={handleAvatarSelect}
          onClose={() => setShowAvatarSelector(false)}
        />
      )}
    </div>
  );
};

export default Profile; 