import React, { useEffect, useState } from 'react';
import { Box, Avatar, Typography, Tooltip } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../types/index';

interface PlayerAvatarsProps {
  playerIds: string[];
  maxDisplay?: number;
}

const PlayerAvatars = ({ playerIds, maxDisplay = 4 }: PlayerAvatarsProps) => {
  const [players, setPlayers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const playerPromises = playerIds.map(async (playerId) => {
          const userDoc = await getDoc(doc(db, 'users', playerId));
          if (userDoc.exists()) {
            return { id: userDoc.id, ...userDoc.data() } as User;
          }
          return null;
        });

        const playersData = (await Promise.all(playerPromises)).filter((player): player is User => player !== null);
        setPlayers(playersData);
      } catch (error) {
        console.error('Error fetching players:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [playerIds]);

  if (loading) {
    return <Typography>Loading players...</Typography>;
  }

  const displayedPlayers = players.slice(0, maxDisplay);
  const remainingCount = players.length - maxDisplay;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {displayedPlayers.map((player) => (
        <Tooltip key={player.id} title={player.displayName || player.email || 'Unknown Player'}>
          <Avatar
            src={player.photoURL}
            alt={player.displayName || player.email || 'Unknown Player'}
            sx={{ width: 32, height: 32 }}
          >
            {player.displayName ? player.displayName[0] : (player.email ? player.email[0] : '?')}
          </Avatar>
        </Tooltip>
      ))}
      {remainingCount > 0 && (
        <Typography variant="body2" color="textSecondary">
          +{remainingCount}
        </Typography>
      )}
    </Box>
  );
};

export default PlayerAvatars; 