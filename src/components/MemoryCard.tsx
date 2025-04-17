import React, { useState, useEffect, FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Memory } from '../types';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Avatar1 from '../assets/avatars/Avatar1.png';
import Avatar2 from '../assets/avatars/Avatar2.png';
import Avatar3 from '../assets/avatars/Avatar3.png';
import Avatar4 from '../assets/avatars/Avatar4.png';
import { UserProfileDialog } from './UserProfileDialog';
import { extractCity } from '../utils/string';
import { toast } from 'react-hot-toast';
import { Delete as DeleteIcon } from '@mui/icons-material';

const avatars = {
  Avatar1,
  Avatar2,
  Avatar3,
  Avatar4,
};

// Format the date to display as "Apr 17" format
const formatEventDate = (dateString: string) => {
  const date = new Date(dateString);
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
};

interface MemoryCardProps {
  memory: Memory;
  onDelete?: (memoryId: string) => void;
}

export const MemoryCard: FC<MemoryCardProps> = ({ memory, onDelete }) => {
  // Return null early if memory is not provided
  if (!memory) return null;

  const { user } = useAuth();
  const navigate = useNavigate();
  const [creatorInfo, setCreatorInfo] = useState<{
    displayName: string;
    photoURL: string;
    emailVerified: boolean;
  } | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if current user is the creator of the memory
  const isCreator = user?.uid === memory.createdBy;

  useEffect(() => {
    const fetchCreatorInfo = async () => {
      if (memory.createdBy) {
        const userDoc = await getDoc(doc(db, 'users', memory.createdBy));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCreatorInfo({
            displayName: userData.displayName || 'Unknown User',
            photoURL: userData.photoURL || 'Avatar1',
            emailVerified: userData.emailVerified || false
          });
        }
      }
    };

    fetchCreatorInfo();
  }, [memory.createdBy]);

  useEffect(() => {
    if (memory.likes && user) {
      setIsLiked(memory.likes.includes(user.uid));
      setLikeCount(memory.likes.length);
    }
  }, [memory.likes, user]);

  const handleLike = async () => {
    if (!user) return;

    try {
      const memoryRef = doc(db, 'memories', memory.id);
      
      if (isLiked) {
        // Unlike
        await updateDoc(memoryRef, {
          likes: arrayRemove(user.uid)
        });
        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        // Like
        await updateDoc(memoryRef, {
          likes: arrayUnion(user.uid)
        });
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const handleEventClick = () => {
    navigate(`/event/${memory.eventId}`);
  };

  const handleDeleteMemory = async () => {
    if (!user || !isCreator || isDeleting) return;
    
    try {
      setIsDeleting(true);
      // Delete the memory document from Firestore
      await deleteDoc(doc(db, 'memories', memory.id));
      toast.success('Memory deleted successfully');
      
      // Call the onDelete callback if provided
      if (onDelete) {
        onDelete(memory.id);
      }
    } catch (error) {
      console.error('Error deleting memory:', error);
      toast.error('Failed to delete memory');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="bg-[#0F0F0F] rounded-xl overflow-hidden border border-gray-800 hover:border-[#C1FF2F] transition-colors">
      {/* Memory image */}
      <div className="relative" style={{ height: "20rem" }}>
        <img
          src={memory.imageUrl}
          alt={memory.eventTitle}
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        
        {/* Event title and date on image */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="text-[#C1FF2F] font-medium text-sm mb-1">{memory.sportType || 'Padel'}</div>
          <h3 className="text-xl font-bold text-white mb-1">{memory.eventTitle}</h3>
          <p className="text-gray-300 text-sm mb-2">
            {extractCity(memory.location)} &middot; {formatEventDate(memory.date)}
          </p>
        </div>
        
        {/* Delete button (only for creator) */}
        {isCreator && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 p-2 rounded-full text-white transition-colors"
            aria-label="Delete memory"
          >
            <DeleteIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => setShowUserProfile(true)}
          >
            <img
              src={avatars[creatorInfo?.photoURL as keyof typeof avatars] || avatars.Avatar1}
              alt={creatorInfo?.displayName || 'Unknown User'}
              className="w-8 h-8 rounded-full hover:opacity-90"
            />
            <div className="flex items-center space-x-1">
              <span className="text-white font-medium">
                {creatorInfo?.displayName || 'Unknown User'}
              </span>
              {creatorInfo?.emailVerified && (
                <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Memory Description */}
        <div className="mb-4">
          <p className="text-gray-300">{memory.description || "No description available."}</p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={handleLike}
            className={`flex items-center justify-center gap-2 p-3 rounded-lg transition-colors ${
              isLiked ? 'bg-[#C1FF2F]/10 text-[#C1FF2F]' : 'bg-[#151515] text-white hover:bg-[#1A1A1A]'
            }`}
          >
            <svg 
              className={`w-5 h-5 ${isLiked ? 'fill-current' : 'stroke-current fill-none'}`} 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
              />
            </svg>
            <span>{likeCount} {likeCount === 1 ? 'Like' : 'Likes'}</span>
          </button>
          
          <button
            onClick={handleEventClick}
            className="flex items-center justify-center gap-2 p-3 rounded-lg bg-[#151515] text-white hover:bg-[#1A1A1A] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>View Event</span>
          </button>
        </div>

        {/* Time info */}
        <div className="text-sm text-gray-500">
          Posted {new Date(memory.createdAt).toLocaleDateString()} {new Date(memory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* User profile dialog */}
      <UserProfileDialog
        open={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        userId={memory.createdBy}
      />

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1A1A] rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-white mb-4">Delete Memory</h3>
            <p className="text-gray-300 mb-6">Are you sure you want to delete this memory? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMemory}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <DeleteIcon className="mr-2 h-4 w-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 