import React from 'react';
import { EventCard } from '../components/EventCard';
import { useEvents } from '../hooks/useEvents';
import { useAuth } from '../hooks/useAuth';

export const Home = () => {
  const { events, loading, error } = useEvents();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Events</h1>
      </div>

      {loading ? (
        <div className="text-center text-white">Loading events...</div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : events.length === 0 ? (
        <div className="text-center text-white">No events found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home; 