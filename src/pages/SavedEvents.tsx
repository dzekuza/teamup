import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Event } from '../types';
import { EventCard } from '../components/EventCard';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { SportTypeFilter } from '../components/SportTypeFilter';
import { CreateEventDialog } from '../components/CreateEventDialog';
import { FunnelIcon } from '@heroicons/react/24/outline';
import { Filters } from '../components/Filters';

interface SavedEventRecord {
  userId: string;
  eventId: string;
  savedAt: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  sportType: string;
}

interface FilterOptions {
  date: string;
  level: string;
  location: string;
  searchTerm: string;
  sportType: string;
  eventStatus: string;
  showJoinedOnly: boolean;
}

export const SavedEvents: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    date: '',
    level: '',
    location: '',
    searchTerm: '',
    sportType: '',
    eventStatus: 'active',
    showJoinedOnly: false,
  });

  const handleEventUpdated = () => {
    // Force a refresh of the events list
    setRefreshKey(prevKey => prevKey + 1);
  };

  useEffect(() => {
    const fetchSavedEvents = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Query saved events for the current user
        const savedEventsQuery = query(
          collection(db, 'savedEvents'),
          where('userId', '==', user.uid)
        );
        
        const savedEventsSnapshot = await getDocs(savedEventsQuery);
        const savedEventRecords = savedEventsSnapshot.docs.map(doc => doc.data() as SavedEventRecord);
        
        if (savedEventRecords.length === 0) {
          setSavedEvents([]);
          setLoading(false);
          return;
        }
        
        // Fetch full event details for each saved event
        const eventPromises = savedEventRecords.map(async record => {
          try {
            const eventDoc = await getDoc(doc(db, 'events', record.eventId));
            if (eventDoc.exists()) {
              return { id: eventDoc.id, ...eventDoc.data() } as Event;
            }
            return null;
          } catch (err) {
            console.error(`Error fetching event ${record.eventId}:`, err);
            return null;
          }
        });
        
        const events = (await Promise.all(eventPromises)).filter(Boolean) as Event[];
        
        // Apply filters
        let filteredEvents = events;
        
        if (filters.sportType) {
          filteredEvents = filteredEvents.filter(event => 
            event.sportType === filters.sportType
          );
        }
        
        if (filters.location) {
          filteredEvents = filteredEvents.filter(event => 
            event.location === filters.location
          );
        }
        
        if (filters.level) {
          filteredEvents = filteredEvents.filter(event => 
            event.level === filters.level
          );
        }
        
        if (filters.eventStatus) {
          filteredEvents = filteredEvents.filter(event => 
            event.status === filters.eventStatus
          );
        }
        
        if (filters.searchTerm) {
          const searchTerm = filters.searchTerm.toLowerCase();
          filteredEvents = filteredEvents.filter(event =>
            event.title.toLowerCase().includes(searchTerm) ||
            event.location.toLowerCase().includes(searchTerm)
          );
        }
        
        setSavedEvents(filteredEvents);
        setError(null);
      } catch (err) {
        console.error('Error fetching saved events:', err);
        setError('Failed to load saved events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSavedEvents();
  }, [user, refreshKey, filters]);

  const handleEventClick = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };

  const handleCreateClick = () => {
    setShowCreateDialog(true);
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleSportTypeChange = (sportType: string) => {
    setFilters(prev => ({ 
      ...prev, 
      sportType 
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#121212] py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-gray-500 mb-4">Please log in to view your saved events</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-[#C1FF2F] text-black rounded-lg px-6 py-3 font-medium hover:bg-[#B1EF1F] transition-colors"
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with title and mobile filter button */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Saved Events</h1>
          
          <button
            type="button"
            className="md:hidden inline-flex items-center gap-x-2 rounded-md bg-[#1A1A1A] px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#2A2A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C1FF2F]"
            onClick={() => setShowMobileFilters(true)}
          >
            <FunnelIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            Filters
          </button>
        </div>

        {/* Sport Type Filter */}
        <div className="mb-6">
          <SportTypeFilter
            selectedSportType={filters.sportType}
            onChange={handleSportTypeChange}
          />
        </div>

        {/* Desktop filters */}
        <div className="hidden md:block mb-6">
          <Filters
            onFilterChange={handleFilterChange}
            currentFilters={filters}
            showMobileFilters={showMobileFilters}
            onCloseMobileFilters={() => setShowMobileFilters(false)}
            hideSportTypeFilter={true}
          />
        </div>

        {/* Event List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#C1FF2F]"></div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-red-500">{error}</p>
          </div>
        ) : savedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-gray-500 mb-4">You haven't saved any events yet</p>
            <button
              onClick={handleCreateClick}
              className="bg-[#C1FF2F] text-black rounded-lg px-6 py-3 font-medium hover:bg-[#B1EF1F] transition-colors"
            >
              Create Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => handleEventClick(event.id)}
                className="cursor-pointer"
              >
                <EventCard event={event} onEventUpdated={handleEventUpdated} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile filters */}
      <Filters
        onFilterChange={handleFilterChange}
        currentFilters={filters}
        showMobileFilters={showMobileFilters}
        onCloseMobileFilters={() => setShowMobileFilters(false)}
        isMobile
        hideSportTypeFilter={true}
      />

      {/* Create Event Dialog */}
      {showCreateDialog && (
        <CreateEventDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onEventCreated={() => {
            setShowCreateDialog(false);
            handleEventUpdated();
          }}
        />
      )}
    </div>
  );
}; 