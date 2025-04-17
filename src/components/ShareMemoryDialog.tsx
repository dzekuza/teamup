import React, { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { Event } from '../types';
import { Close as CloseIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';

// Helper type for player objects
interface PlayerObject {
  id: string;
  displayName?: string;
  name?: string;
  photoURL?: string;
  level?: string;
}

// Helper function to check if player is an object
const isPlayerObject = (player: any): player is PlayerObject => {
  return player && typeof player === 'object' && 'id' in player;
};

interface ShareMemoryDialogProps {
  open: boolean;
  onClose: () => void;
  event: Event;
}

export const ShareMemoryDialog: React.FC<ShareMemoryDialogProps> = ({
  open,
  onClose,
  event,
}) => {
  const { user } = useAuth();
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setImage(selectedFile);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to share memories');
      return;
    }
    
    if (!image) {
      toast.error('Please select an image to upload');
      return;
    }
    
    // Check if the user is a participant in the event
    const isParticipant = event.players.some(player => {
      if (typeof player === 'string') {
        return player === user.uid;
      } else if (isPlayerObject(player)) {
        return player.id === user.uid;
      }
      return false;
    });

    if (!isParticipant) {
      toast.error('Only event participants can share memories');
      return;
    }
    
    try {
      setUploading(true);
      
      // Upload image to Firebase Storage
      const storageRef = ref(storage, `memories/${event.id}/${Date.now()}_${image.name}`);
      const uploadResult = await uploadBytes(storageRef, image);
      const imageUrl = await getDownloadURL(uploadResult.ref);
      
      // Get user data for the memory
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      // Save memory to Firestore
      const memoryData = {
        eventId: event.id,
        eventTitle: event.title,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        userName: user.displayName || userData.displayName || user.email || 'Anonymous User',
        userAvatar: userData.photoURL || '/images/default-avatar.png',
        imageUrl,
        description,
        likes: [],
        sportType: event.sportType,
        location: event.location,
        date: event.date
      };
      
      await addDoc(collection(db, 'memories'), memoryData);
      
      toast.success('Memory shared successfully!');
      onClose();
    } catch (error) {
      console.error('Error sharing memory:', error);
      toast.error('Failed to share memory. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#0F0F0F] rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Share Event Memory</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          {/* Image Upload */}
          <div className="mb-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              ref={fileInputRef}
            />
            
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden mb-2">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-64 object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div 
                onClick={triggerFileInput}
                className="border-2 border-dashed border-gray-700 rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 transition-colors"
              >
                <svg className="w-12 h-12 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                <p className="text-gray-500">Click to upload an image</p>
                <p className="text-gray-600 text-sm mt-1">Accepted formats: JPG, PNG, GIF</p>
              </div>
            )}
          </div>
          
          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-gray-400 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Share your thoughts about this event..."
              className="w-full bg-[#151515] text-white p-3 rounded-xl border border-gray-800 focus:border-[#C1FF2F] focus:outline-none resize-none h-24"
            />
          </div>
          
          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-white bg-[#151515] hover:bg-[#1A1A1A]"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#C1FF2F] text-black font-medium hover:bg-[#B1EF1F] disabled:opacity-50 flex items-center"
              disabled={uploading || !image}
            >
              {uploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                'Share Memory'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add default export for React.lazy
export default ShareMemoryDialog; 