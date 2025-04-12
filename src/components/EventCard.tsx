import { FC } from 'react';
import { Link } from 'react-router-dom';
import { Event } from '../types';
import { useAuth } from '../hooks/useAuth';

interface EventCardProps {
  event: Event;
}

export const EventCard: FC<EventCardProps> = ({ event }) => {
  const { user } = useAuth();
  const isJoined = user && event.players.includes(user.uid);

  return (
    <div className="bg-[#1E1E1E] rounded-3xl p-6 space-y-4">
      {/* Status Badge */}
      <div className="inline-block bg-[#C1FF2F] text-black px-4 py-1 rounded-full text-sm font-medium">
        {event.currentPlayers}/{event.maxPlayers} joined
      </div>

      {/* Event Details */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-white">{event.title}</h2>
        <p className="text-gray-400">{event.date}, at {event.time}</p>
        <p className="text-gray-400">{event.location}</p>
      </div>

      {/* Player Avatars */}
      <div className="flex -space-x-3">
        {event.players.map((playerId, index) => (
          <div 
            key={playerId}
            className="w-10 h-10 rounded-full bg-white border-2 border-[#1E1E1E]"
          />
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-3 pt-4">
        <Link 
          to={`/event/${event.id}`}
          className={`block w-full text-center py-3 rounded-xl border ${
            isJoined 
              ? 'border-[#C1FF2F] text-[#C1FF2F]' 
              : 'bg-[#C1FF2F] text-black hover:bg-[#B1EF1F] transition-colors'
          }`}
        >
          {isJoined ? 'Joined' : 'Join event'}
        </Link>
        {user?.uid === event.createdBy && (
          <Link 
            to={`/edit-event/${event.id}`}
            className="block w-full text-center py-2 text-[#C1FF2F] hover:underline"
          >
            Edit event
          </Link>
        )}
      </div>
    </div>
  );
}; 