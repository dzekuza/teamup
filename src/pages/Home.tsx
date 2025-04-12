import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useEvents } from '../hooks/useEvents';
import { EventCard } from '../components/EventCard';
import { Button } from '../components/ui/button';
import CreateEventDialog from '../components/CreateEventDialog';

const Home = () => {
  const { user } = useAuth();
  const { events, loading, error } = useEvents();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleEventCreated = () => {
    // Refresh events list
    window.location.reload();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Padel Events</h1>
        {user && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            Create Event
          </Button>
        )}
      </div>

      {!user && (
        <div className="bg-muted p-4 rounded-lg mb-8">
          <p>Please log in to create events and join games.</p>
        </div>
      )}

      {loading ? (
        <div className="text-center">Loading events...</div>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : events.length === 0 ? (
        <div className="text-center text-muted-foreground">
          No events found. Be the first to create one!
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      <CreateEventDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onEventCreated={handleEventCreated}
      />
    </div>
  );
};

export default Home; 