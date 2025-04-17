import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, getDoc, doc, updateDoc, arrayUnion, arrayRemove, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { MemoryCard } from '../components/MemoryCard';
import { Memory } from '../types/index';
import { useNavigate } from 'react-router-dom';

export const Community: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        setLoading(true);
        const memoriesRef = collection(db, 'memories');
        const q = query(memoriesRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const memoriesData: Memory[] = [];
        
        // Process each memory
        for (const docSnapshot of querySnapshot.docs) {
          const memoryData = docSnapshot.data();
          
          // Create memory object matching the Memory interface
          const memory: Memory = {
            id: docSnapshot.id,
            eventId: memoryData.eventId || '',
            eventTitle: memoryData.eventTitle || '',
            imageUrl: memoryData.imageUrl || '',
            createdBy: memoryData.createdBy || '',
            createdAt: memoryData.createdAt || new Date().toISOString(),
            likes: memoryData.likes || [],
            sportType: memoryData.sportType || '',
            date: memoryData.date || new Date().toISOString(),
            location: memoryData.location || '',
            description: memoryData.description || ''
          };
          
          memoriesData.push(memory);
        }
        
        setMemories(memoriesData);
      } catch (error) {
        console.error('Error fetching memories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMemories();
  }, []);

  const handleLikeMemory = async (memory: Memory) => {
    if (!user) {
      toast.error('You must be logged in to like memories');
      return;
    }

    try {
      const memoryRef = doc(db, 'memories', memory.id);
      const isLiked = memory.likes.includes(user.uid);
      
      if (isLiked) {
        // Unlike the memory
        await updateDoc(memoryRef, {
          likes: arrayRemove(user.uid)
        });
        
        // Update local state
        setMemories(prevMemories => 
          prevMemories.map(m => 
            m.id === memory.id 
              ? { ...m, likes: m.likes.filter(id => id !== user.uid) } 
              : m
          )
        );
      } else {
        // Like the memory
        await updateDoc(memoryRef, {
          likes: arrayUnion(user.uid)
        });
        
        // Update local state
        setMemories(prevMemories => 
          prevMemories.map(m => 
            m.id === memory.id 
              ? { ...m, likes: [...m.likes, user.uid] } 
              : m
          )
        );
      }
    } catch (error) {
      console.error('Error updating like status:', error);
      toast.error('Failed to update like status');
    }
  };

  // Handle memory deletion
  const handleMemoryDelete = (memoryId: string) => {
    // Remove the deleted memory from the state
    setMemories(prevMemories => prevMemories.filter(memory => memory.id !== memoryId));
  };

  return (
    <div className="min-h-screen bg-[#121212] pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-8">Community Memories</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#C1FF2F]"></div>
          </div>
        ) : memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-xl font-semibold text-white mb-2">No memories have been shared yet.</p>
            <p className="text-gray-400">Be the first to share a memory from one of your games!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memories.map((memory) => (
              <MemoryCard 
                key={memory.id} 
                memory={memory}
                onDelete={handleMemoryDelete} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Community; 