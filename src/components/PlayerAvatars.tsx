import React, { useEffect, useState } from 'react';
import { Box, Avatar, Typography, Tooltip } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../types/index';
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

interface PlayerAvatarsProps {
  playerIds: string[];
  maxDisplay?: number;
}

const PlayerAvatars: React.FC<PlayerAvatarsProps> = ({ playerIds, maxDisplay = 3 }) => {
  const [players, setPlayers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      if (!playerIds.length) {
        setLoading(false);
        return;
      }

      try {
        const fetchedPlayers = await Promise.all(
          playerIds.map(async (id) => {
            const userDoc = await getDoc(doc(db, 'users', id));
            if (userDoc.exists()) {
              return { id, ...userDoc.data() } as User;
            }
            return null;
          })
        );

        setPlayers(fetchedPlayers.filter((p): p is User => p !== null));
      } catch (error) {
        console.error('Error fetching players:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [playerIds]);

  if (loading) {
    return <div className="flex space-x-1">Loading...</div>;
  }

  // Display a subset of players if needed
  const displayPlayers = players.slice(0, maxDisplay);
  const remainingCount = players.length - maxDisplay;

  return (
    <div className="flex -space-x-2">
      {displayPlayers.map((player) => (
        <Tooltip key={player.id} title={player.displayName || 'Unknown Player'}>
          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border-2 border-white">
            {player.photoURL && avatars[player.photoURL as keyof typeof avatars] ? (
              <img 
                src={avatars[player.photoURL as keyof typeof avatars]} 
                alt={player.displayName || 'Player'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-500 text-white">
                {(player.displayName || 'U')[0]}
              </div>
            )}
          </div>
        </Tooltip>
      ))}
      
      {remainingCount > 0 && (
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center border-2 border-white">
          <span className="text-xs text-gray-700">+{remainingCount}</span>
        </div>
      )}
    </div>
  );
};

export default PlayerAvatars; 