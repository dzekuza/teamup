import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { toast } from 'react-hot-toast';
import { MemoryCard } from '../components/MemoryCard';
import { Memory } from '../types/index';

export const Community: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSupabaseAuth();

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        setLoading(true);
        const { data: memoriesRows, error: memoriesError } = await supabase
          .from('memories')
          .select('*')
          .order('created_at', { ascending: false });

        if (memoriesError) throw memoriesError;

        const memoryIds = (memoriesRows || []).map(m => m.id);
        const likesByMemory: Record<string, string[]> = {};

        if (memoryIds.length > 0) {
          const { data: likesRows, error: likesError } = await supabase
            .from('memory_likes')
            .select('memory_id, user_id')
            .in('memory_id', memoryIds);

          if (likesError) throw likesError;

          for (const like of likesRows || []) {
            if (!likesByMemory[like.memory_id]) {
              likesByMemory[like.memory_id] = [];
            }
            likesByMemory[like.memory_id].push(like.user_id);
          }
        }

        const memoriesData: Memory[] = (memoriesRows || []).map(memoryRow => ({
          id: memoryRow.id,
          eventId: memoryRow.event_id || '',
          eventTitle: memoryRow.event_title || '',
          imageUrl: memoryRow.image_url || '',
          createdBy: memoryRow.created_by || '',
          createdAt: memoryRow.created_at || new Date().toISOString(),
          likes: likesByMemory[memoryRow.id] || [],
          sportType: memoryRow.sport_type || '',
          date: memoryRow.date || new Date().toISOString(),
          location: memoryRow.location || '',
          description: memoryRow.description || ''
        }));

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
      const isLiked = memory.likes.includes(user.id);

      if (isLiked) {
        const { error } = await supabase
          .from('memory_likes')
          .delete()
          .eq('memory_id', memory.id)
          .eq('user_id', user.id);

        if (error) throw error;

        setMemories(prevMemories =>
          prevMemories.map(m =>
            m.id === memory.id
              ? { ...m, likes: m.likes.filter(id => id !== user.id) }
              : m
          )
        );
      } else {
        const { error } = await supabase
          .from('memory_likes')
          .insert({ memory_id: memory.id, user_id: user.id });

        if (error) throw error;

        setMemories(prevMemories =>
          prevMemories.map(m =>
            m.id === memory.id
              ? { ...m, likes: [...m.likes, user.id] }
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
