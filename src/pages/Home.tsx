import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useEvents } from '../hooks/useEvents';
import { EventCard } from '../components/EventCard';
import { CreateEventDialog } from '../components/CreateEventDialog';
import { FilterBar } from '../components/FilterBar';

const Home = () => {
  const { user } = useAuth();
  const { events, loading, error } = useEvents();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    date: '',
    level: '',
    location: ''
  });

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      date: '',
      level: '',
      location: ''
    });
  };

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const dateMatch = !filters.date || event.date === filters.date;
      const levelMatch = !filters.level || event.level === filters.level;
      const locationMatch = !filters.location || event.location === filters.location;
      return dateMatch && levelMatch && locationMatch;
    });
  }, [events, filters]);

  const handleEventChange = () => {
    // Refresh events list
    window.location.reload();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-white mb-8">All events</h1>
        
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="text-gray-400">Loading events...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-gray-400">
              {events.length === 0
                ? "No events found. Be the first to create one!"
                : "No events match your filters."}
            </div>
          ) : (
            filteredEvents.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                onEventUpdated={handleEventChange}
              />
            ))
          )}
        </div>
      </div>

      <CreateEventDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onEventCreated={handleEventChange}
      />
    </div>
  );
};

export default Home; 