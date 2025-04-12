import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Event } from '../types';
import { useAuth } from '../hooks/useAuth';
import { EditEventDialog } from './EditEventDialog';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Avatar1 from '../assets/avatars/Avatar1.png';
import Avatar2 from '../assets/avatars/Avatar2.png';
import Avatar3 from '../assets/avatars/Avatar3.png';
import Avatar4 from '../assets/avatars/Avatar4.png';
import { UserProfileDialog } from './UserProfileDialog';

const avatars = {
  Avatar1,
  Avatar2,
  Avatar3,
  Avatar4,
};

interface EventCardProps {
  event: Event;
  onEventUpdated?: () => void;
}

interface PlayerInfo {
  id: string;
  photoURL: string;
}

export const EventCard: FC<EventCardProps> = ({ event, onEventUpdated }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isJoined = user && event.players.includes(user.uid);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playerInfos, setPlayerInfos] = useState<PlayerInfo[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayerInfos = async () => {
      const infos = await Promise.all(
        event.players.map(async (playerId) => {
          const userDoc = await getDoc(doc(db, 'users', playerId));
          return {
            id: playerId,
            photoURL: userDoc.data()?.photoURL || 'Avatar1'
          };
        })
      );
      setPlayerInfos(infos);
    };

    fetchPlayerInfos();
  }, [event.players]);

  const handleJoinEvent = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        players: arrayUnion(user.uid),
        currentPlayers: event.currentPlayers + 1
      });
      if (onEventUpdated) onEventUpdated();
    } catch (error) {
      console.error('Error joining event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveEvent = async () => {
    if (!user || isLoading) return;
    setIsLoading(true);

    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        players: arrayRemove(user.uid),
        currentPlayers: event.currentPlayers - 1
      });
      if (onEventUpdated) onEventUpdated();
    } catch (error) {
      console.error('Error leaving event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canJoin = !isJoined && event.currentPlayers < event.maxPlayers;

  return (
    <div className="bg-[#1E1E1E] rounded-3xl p-6">
      {/* Status Badge */}
      <div className="inline-block bg-[#C1FF2F] text-black px-3 py-1 rounded-full text-sm font-medium mb-4">
        {event.currentPlayers}/{event.maxPlayers} joined
      </div>

      {/* Event Details */}
      <div className="space-y-1 mb-6">
        <h2 className="text-xl font-medium text-white">{event.title}</h2>
        <p className="text-gray-500 text-sm">
          {event.date}, at {event.time}
        </p>
        <p className="text-gray-500 text-sm">{event.location}</p>
      </div>

      {/* Player Avatars */}
      <div className="flex -space-x-2 mb-6">
        {playerInfos.map((player) => (
          <button 
            key={player.id}
            onClick={() => setSelectedPlayerId(player.id)}
            className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#1E1E1E] hover:scale-110 transition-transform"
          >
            <img
              src={avatars[player.photoURL as keyof typeof avatars] || avatars.Avatar1}
              alt="Player Avatar"
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {canJoin ? (
          <button
            onClick={handleJoinEvent}
            disabled={isLoading}
            className="flex-1 bg-[#C1FF2F] text-black rounded-xl py-2 font-medium hover:bg-[#B1EF1F] transition-colors disabled:opacity-50"
          >
            Join Event
          </button>
        ) : isJoined ? (
          <button
            onClick={handleLeaveEvent}
            disabled={isLoading}
            className="flex-1 bg-transparent border border-red-500 text-red-500 rounded-xl py-2 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
          >
            Leave Event
          </button>
        ) : (
          <button
            disabled
            className="flex-1 bg-gray-600 text-gray-400 rounded-xl py-2 font-medium cursor-not-allowed"
          >
            Event Full
          </button>
        )}

        {user?.uid === event.createdBy && (
          <button
            onClick={() => setIsEditDialogOpen(true)}
            className="px-4 py-2 text-[#C1FF2F] hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      <EditEventDialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        eventId={event.id}
        onEventUpdated={() => onEventUpdated?.()}
      />

      <UserProfileDialog
        open={!!selectedPlayerId}
        onClose={() => setSelectedPlayerId(null)}
        userId={selectedPlayerId || ''}
      />
    </div>
  );
}; 