import React, { FC } from 'react';
import { Event } from '../types/index';
import { EventCard } from './EventCard';

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
  events: Event[];
  loading: boolean;
  error: string | null;
  filters?: Filters;
  onEventClick: (eventId: string) => void;
  onCreateClick: () => void;
  onEventUpdated: () => void;
}

export const EventList: FC<EventListProps> = ({ 
  events,
  loading,
  error,
  filters,
  onEventClick,
  onCreateClick,
  onEventUpdated
}) => {
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
            e.stopPropagation();
            onEventClick(event.id);
          }}
          className="cursor-pointer"
        >
          <EventCard event={event} onEventUpdated={onEventUpdated} />
        </div>
      ))}
    </div>
  );
}; 