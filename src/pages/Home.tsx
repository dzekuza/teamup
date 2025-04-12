import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useEvents } from '../hooks/useEvents';
import { EventCard } from '../components/EventCard';
import { CreateEventDialog } from '../components/CreateEventDialog';
import { FilterBar } from '../components/FilterBar';
import { MapView } from '../components/MapView';
import { Event } from '../types';
import { MapIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { migrateEvents } from '../utils/migrateEvents';
import { Link } from 'react-router-dom';

interface Filters {
  date: string;
  level: string;
  location: string;
}

export const Home = () => {
  const { user } = useAuth();
  const { events, loading, error } = useEvents();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    date: '',
    level: '',
    location: ''
  });
  const [showMap, setShowMap] = useState(false);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      date: '',
      level: '',
      location: ''
    });
  };

  const handleMigration = async () => {
    try {
      await migrateEvents();
      alert('Migration completed successfully!');
    } catch (error) {
      console.error('Migration failed:', error);
      alert('Migration failed. Check console for details.');
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (filters.date && event.date !== filters.date) return false;
      if (filters.level && event.level !== filters.level) return false;
      if (filters.location && !event.location.includes(filters.location)) return false;
      return true;
    });
  }, [events, filters]);

  const handleEventChange = () => {
    // Refresh events list
    window.location.reload();
  };

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