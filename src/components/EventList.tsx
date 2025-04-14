import { FC, useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
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
}

interface EventListProps {
  filters?: Filters;
  onEventClick: (eventId: string) => void;
  onCreateClick: () => void;
}

export const EventList: FC<EventListProps> = ({ 
  filters = { date: '', level: '', location: '', showJoinedOnly: false, searchTerm: '', sportType: '' },
  onEventClick,
  onCreateClick
}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      // Start with a base query
      let eventsQuery = query(collection(db, 'events'));
      
      // Apply filters first
      if (filters.location) {
        eventsQuery = query(eventsQuery, where('location', '==', filters.location));
      }
      
      if (filters.date) {
        eventsQuery = query(eventsQuery, where('date', '==', filters.date));
      }
      
      if (filters.level) {
        eventsQuery = query(eventsQuery, where('level', '==', filters.level));
      }

      if (filters.sportType) {
        eventsQuery = query(eventsQuery, where('sportType', '==', filters.sportType));
      }
      
      // Apply ordering last
      eventsQuery = query(
        eventsQuery,
        orderBy('date', 'asc'),
        orderBy('time', 'asc')
      );

      const unsubscribe = onSnapshot(eventsQuery, 
        (snapshot) => {
          let eventsList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Event[];

          // Filter for joined events if showJoinedOnly is true and user is logged in
          if (filters.showJoinedOnly && user) {
            eventsList = eventsList.filter(event => 
              event.players && event.players.some(player => player && player.id === user.uid)
            );
          }

          // Apply search filter if searchTerm is provided
          if (filters.searchTerm) {
            const searchTermLower = filters.searchTerm.toLowerCase();
            eventsList = eventsList.filter(event => {
              // Search in title
              if (event.title && event.title.toLowerCase().includes(searchTermLower)) {
                return true;
              }
              
              // Search in location
              if (event.location && event.location.toLowerCase().includes(searchTermLower)) {
                return true;
              }
              
              // Search in date
              if (event.date && event.date.toLowerCase().includes(searchTermLower)) {
                return true;
              }
              
              // Search in players
              if (event.players && event.players.some(player => 
                player && player.name && player.name.toLowerCase().includes(searchTermLower)
              )) {
                return true;
              }
              
              // Search in creator
              if (event.createdBy && event.createdBy.toLowerCase().includes(searchTermLower)) {
                return true;
              }
              
              return false;
            });
          }

          setEvents(eventsList);
          setLoading(false);
          setError(null);
        }, 
        (error) => {
          console.error("Error listening to events:", error);
          setError("Failed to load events. Please try again later.");
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up events query:", error);
      setError("Failed to set up events query. Please try again later.");
      setLoading(false);
    }
  }, [filters, user]);

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
          onClick={() => onEventClick(event.id)}
          className="cursor-pointer"
        >
          <EventCard event={event} />
        </div>
      ))}
    </div>
  );
}; 