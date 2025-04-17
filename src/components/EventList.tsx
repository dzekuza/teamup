import React, { FC, useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Event } from '../types/index';
import { EventCard } from './EventCard';
import { useAuth } from '../hooks/useAuth';

interface Filters {
  date: string;
  level: string;
  location: string;
  showJoinedOnly: boolean;
  searchTerm: string;
  sportType: string;
  eventStatus: string;
}

interface EventListProps {
  filters?: Filters;
  onEventClick: (eventId: string) => void;
  onCreateClick: () => void;
}

export const EventList: FC<EventListProps> = ({ 
  filters = { date: '', level: '', location: '', showJoinedOnly: false, searchTerm: '', sportType: '', eventStatus: '' },
  onEventClick,
  onCreateClick
}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEventUpdated = () => {
    // Force a refresh of the events list
    setRefreshKey(prevKey => prevKey + 1);
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        let eventsQuery = query(collection(db, 'events'));

        // Apply filters
        if (filters.location) {
          // Normalize the location name for comparison
          const normalizedLocation = filters.location.trim();
          eventsQuery = query(eventsQuery, where('location', '==', normalizedLocation));
        }
        if (filters.level) {
          eventsQuery = query(eventsQuery, where('level', '==', filters.level));
        }
        if (filters.sportType) {
          eventsQuery = query(eventsQuery, where('sportType', '==', filters.sportType));
        }

        // Handle event status filter
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        if (filters.eventStatus === 'active' || filters.eventStatus === '') {
          // Active events are those that haven't ended yet
          eventsQuery = query(
            eventsQuery,
            where('status', '==', 'active'),
            where('date', '>=', today)
          );
        } else if (filters.eventStatus === 'completed') {
          // Completed events are those that are marked as completed
          eventsQuery = query(
            eventsQuery,
            where('status', '==', 'completed')
          );
        }

        const querySnapshot = await getDocs(eventsQuery);
        let eventsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Event[];

        // Apply search filter
        if (filters.searchTerm) {
          const searchTerm = filters.searchTerm.toLowerCase();
          eventsList = eventsList.filter(event =>
            event.title.toLowerCase().includes(searchTerm) ||
            event.location.toLowerCase().includes(searchTerm) ||
            event.players.some(player => player && player.name && player.name.toLowerCase().includes(searchTerm))
          );
        }

        // Apply joined filter
        if (filters.showJoinedOnly) {
          if (user) {
            eventsList = eventsList.filter(event =>
              event.players && event.players.filter(player => player !== null).some(player => player.id === user.uid)
            );
          }
        }

        setEvents(eventsList);
        setError(null);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [filters, user, refreshKey]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#C1FF2F]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-500 mb-4">No events found</p>
        <button
          onClick={onCreateClick}
          className="bg-[#C1FF2F] text-black rounded-lg px-6 py-3 font-medium hover:bg-[#B1EF1F] transition-colors"
        >
          Create Event
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <div
          key={event.id}
          onClick={(e) => {
            e.stopPropagation(); // Stop propagation to prevent unintended clicks
            onEventClick(event.id);
          }}
          className="cursor-pointer"
        >
          <EventCard event={event} onEventUpdated={handleEventUpdated} />
        </div>
      ))}
    </div>
  );
}; 