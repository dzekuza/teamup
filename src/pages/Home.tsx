import React, { useState, type FC, useEffect, useRef } from 'react';
import { CreateEventDialog } from '../components/CreateEventDialog';
import { EditEventDialog } from '../components/EditEventDialog';
import { Filters } from '../components/Filters';
import { EventList } from '../components/EventList';
import { FunnelIcon, PlusIcon, MagnifyingGlassIcon, MapPinIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { useProfileCompletion } from '../hooks/useProfileCompletion';
import { useNavigate } from 'react-router-dom';
import ProfileCompletionAlert from '../components/ProfileCompletionAlert';
import { UserProfileDialog } from '../components/UserProfileDialog';
import { NotificationsPage } from '../components/NotificationsPage';
import { SportTypeFilter } from '../components/SportTypeFilter';
import Map, { Marker } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Event, Player } from '../types/index';
import { PADEL_LOCATIONS, Location as PadelLocation } from '../constants/locations'; // Import and alias Location
import { CalendarDaysIcon, ClockIcon, ScaleIcon } from '@heroicons/react/20/solid'; // Icons for popup

interface FilterOptions {
  date: string;
  level: string;
  location: string;
  showJoinedOnly: boolean;
  searchTerm: string;
  sportType: string;
  eventStatus: string;
}

interface HomeProps {
  myEventsOnly?: boolean;
  notificationsOnly?: boolean;
}

// Define sport icons (adjust as needed)
const SPORT_ICONS: { [key: string]: string } = {
  'Padel': '🎾',
  'Tennis': '🎾',
  'Running': '🏃',
  'Soccer': '⚽',
  'Basketball': '🏀',
  'Cycling': '🚴',
  // Add other sports from your app if necessary
  'Default': '❓' // Fallback icon
};

// Helper to format date (similar to EventCard)
const formatEventDate = (dateString: string) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (error) {
    console.error("Error formatting date:", error);
    return '';
  }
};

// Helper to format time (optional, basic example)
const formatEventTime = (timeString: string) => {
  if (!timeString) return '';
  // Basic formatting, assumes HH:MM
  return timeString;
};

// Helper to get cover image URL (similar to EventCard)
const getEventCoverImageUrl = (event: Event): string => {
  const locationData = PADEL_LOCATIONS.find(loc => loc.name === event.location);
  const DEFAULT_COVER_IMAGE = "https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.appspot.com/o/Locations%2Fstatic%20cover.jpg?alt=media&token=4c319254-5854-4b3c-9bc7-e67cfe1a58b1";
  
  return event.coverImageURL 
    ? event.coverImageURL
    : event?.sportType === 'Padel' && locationData?.image
      ? locationData.image
      : DEFAULT_COVER_IMAGE;
};

// Helper to get coordinates for an event
const getEventCoordinates = (event: Event): { lat: number; lng: number } | null => {
  if (event.sportType === 'Padel') {
    const padelLoc = PADEL_LOCATIONS.find(loc => loc.name === event.location);
    return padelLoc?.coordinates || null;
  } else if (event.customLocationCoordinates) {
    return event.customLocationCoordinates;
  }
  return null;
};

export const Home: FC<HomeProps> = ({ myEventsOnly = false, notificationsOnly = false }) => {
  const { user } = useAuth();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    date: '',
    level: '',
    location: '',
    showJoinedOnly: false,
    searchTerm: '',
    sportType: '',
    eventStatus: 'active',
  });
  const { missingFields } = useProfileCompletion();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hoveredEvent, setHoveredEvent] = useState<Event | null>(null);
  const mapRef = useRef<any>(null);
  const [popupPosition, setPopupPosition] = useState<{x: number; y: number} | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  useEffect(() => {
    if (myEventsOnly) {
      setFilters(prev => ({ ...prev, showJoinedOnly: true }));
    }
  }, [myEventsOnly]);

  const handleFilterChange = (newFilters: FilterOptions) => {
    if (myEventsOnly) {
      setFilters({ ...newFilters, showJoinedOnly: true });
    } else {
      setFilters(newFilters);
    }
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };

  const handleCreateClick = () => {
    setShowCreateDialog(true);
  };

  const handleSportTypeChange = (sportType: string) => {
    setFilters(prev => ({ 
      ...prev, 
      sportType 
    }));
  };
  
  const handleSearchChange = (searchTerm: string) => {
    setFilters(prev => ({
      ...prev,
      searchTerm
    }));
  };

  const getPageTitle = () => {
    if (myEventsOnly) return "My Events";
    if (notificationsOnly) return "Notifications";
    return "Events";
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoadingEvents(true);
        let eventsQuery = query(collection(db, 'events'));

        if (filters.location) {
          const normalizedLocation = filters.location.trim();
          eventsQuery = query(eventsQuery, where('location', '==', normalizedLocation));
        }
        if (filters.level) {
          eventsQuery = query(eventsQuery, where('level', '==', filters.level));
        }
        if (filters.sportType) {
          eventsQuery = query(eventsQuery, where('sportType', '==', filters.sportType));
        }
        
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        if (filters.eventStatus === 'active' || filters.eventStatus === '') {
          eventsQuery = query(
            eventsQuery,
            where('status', '==', 'active'),
            where('date', '>=', today)
          );
        } else if (filters.eventStatus === 'completed') {
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

        if (filters.searchTerm) {
          const searchTerm = filters.searchTerm.toLowerCase();
          eventsList = eventsList.filter(event => {
            const locationString = typeof event.location === 'string' ? event.location : '';
            const titleMatch = event.title.toLowerCase().includes(searchTerm);
            const locationMatch = locationString.toLowerCase().includes(searchTerm);
            const playerMatch = event.players && event.players.some(player => 
              player && typeof player === 'object' && player.name && player.name.toLowerCase().includes(searchTerm)
            );
            return titleMatch || locationMatch || playerMatch;
          });
        }

        if (filters.showJoinedOnly || myEventsOnly) {
          if (user) {
            eventsList = eventsList.filter(event =>
              event.players && event.players.some(player => 
                player && typeof player === 'object' && player.id === user.uid
              )
            );
          } else {
            eventsList = [];
          }
        }

        setEvents(eventsList);
        setEventsError(null);
      } catch (err) {
        console.error('Error fetching events:', err);
        setEventsError('Failed to load events. Please try again later.');
      } finally {
        setLoadingEvents(false);
      }
    };

    if (!notificationsOnly) {
      fetchEvents();
    } else {
      setEvents([]);
      setLoadingEvents(false);
    }
  }, [filters, user, refreshKey, notificationsOnly, myEventsOnly]);

  // useEffect for map centering
  useEffect(() => {
    if (viewMode === 'map' && mapRef.current) {
      const map = mapRef.current.getMap();
      if (!map) return;
      
      // Use the helper function to get coordinates
      const coordinates = events
        .map(getEventCoordinates) // Use helper here
        .filter(coord => coord !== null) as { lat: number; lng: number }[];

      if (coordinates.length === 0) return; 

      if (coordinates.length === 1) {
        map.flyTo({ center: [coordinates[0]!.lng, coordinates[0]!.lat], zoom: 13, essential: true });
        return;
      }
      
      // Use LngLatBounds from the maplibregl instance
      const bounds = new maplibregl.LngLatBounds();
      coordinates.forEach(coord => {
        bounds.extend([coord.lng, coord.lat]);
      });
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, essential: true });
    }
  }, [viewMode, events]); // Depend on events array

  // useEffect for popup positioning (using mapRef)
  useEffect(() => {
    if (hoveredEvent && hoveredEvent.customLocationCoordinates && mapRef.current) {
      const map = mapRef.current.getMap();
      if (!map) return; // Add null check for map instance
      
      const point = map.project([hoveredEvent.customLocationCoordinates.lng, hoveredEvent.customLocationCoordinates.lat]);
      setPopupPosition(point);
    } else {
      setPopupPosition(null);
    }
  }, [hoveredEvent]);

  // Define initial view state centered on Lithuania
  const initialViewState = {
    longitude: 23.88, // Approx center longitude for Lithuania
    latitude: 55.17,  // Approx center latitude for Lithuania
    zoom: 6.5         // Zoom level to show Lithuania
  };

  const handleEventUpdated = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <div className="min-h-screen bg-[#121212] pb-24 md:pb-8">
      <div className="md:hidden sticky top-0 z-30 bg-[#121212]/80 backdrop-blur-md shadow-md">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">{getPageTitle()}</h1>
            {!notificationsOnly && (
              <div className="flex items-center space-x-1 bg-[#1A1A1A] p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${ 
                    viewMode === 'grid' 
                      ? 'bg-[#C1FF2F] text-black' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                  aria-label="Grid View"
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${ 
                    viewMode === 'map' 
                      ? 'bg-[#C1FF2F] text-black' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                  aria-label="Map View"
                >
                  <MapPinIcon className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          {!notificationsOnly && (
            <div className="mb-4 flex items-center gap-2">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  value={filters.searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-[#1A1A1A] text-white border border-gray-800 rounded-lg pl-10 p-2 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F] focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowMobileFilters(true)}
                className="flex-shrink-0 p-2 bg-[#1A1A1A] text-gray-400 border border-gray-800 rounded-lg hover:text-white hover:border-gray-600 transition-colors"
                aria-label="Open Filters"
              >
                <FunnelIcon className="h-5 w-5" />
              </button>
            </div>
          )}

          {!notificationsOnly && (
            <div className="pb-2 overflow-x-auto">
              <SportTypeFilter
                selectedSportType={filters.sportType}
                onChange={handleSportTypeChange}
              />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-8">
        <div className="hidden md:flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">{getPageTitle()}</h1>
           {!notificationsOnly && (
              <div className="flex items-center space-x-1 bg-[#1A1A1A] p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${ 
                    viewMode === 'grid' 
                      ? 'bg-[#C1FF2F] text-black' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                  aria-label="Grid View"
                >
                  <Squares2X2Icon className="h-5 w-5" />
                  <span>Grid</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${ 
                    viewMode === 'map' 
                      ? 'bg-[#C1FF2F] text-black' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                  aria-label="Map View"
                >
                  <MapPinIcon className="h-5 w-5" />
                  <span>Map</span>
                </button>
              </div>
            )}
        </div>

        {!notificationsOnly && (
          <div className="hidden md:block mb-6">
            <SportTypeFilter
              selectedSportType={filters.sportType}
              onChange={handleSportTypeChange}
            />
          </div>
        )}

        {!notificationsOnly && (
          <div className="hidden md:block mb-6">
            <Filters
              onFilterChange={handleFilterChange}
              currentFilters={filters}
              showMobileFilters={showMobileFilters}
              onCloseMobileFilters={() => setShowMobileFilters(false)}
              hideSportTypeFilter={true}
            />
          </div>
        )}

        {notificationsOnly ? (
          <NotificationsPage />
        ) : viewMode === 'grid' ? (
          <EventList
            events={events}
            loading={loadingEvents}
            error={eventsError}
            filters={filters}
            onEventClick={handleEventClick}
            onCreateClick={handleCreateClick}
            onEventUpdated={handleEventUpdated}
          />
        ) : (
          <div className="h-[60vh] rounded-lg overflow-hidden relative">
            <Map
              mapLib={Promise.resolve(maplibregl)}
              initialViewState={{
                longitude: 25.2797, // Default center (Vilnius)
                latitude: 54.6872,
                zoom: 11
              }}
              style={{ width: '100%', height: '100%' }}
              mapStyle="https://api.maptiler.com/maps/streets-v2-dark/style.json?key=33rTk4pHojFrbxONf77X"
              onError={(e: Error) => console.error("Map error:", e)}
            >
              {events.map(event => {
                // Use the helper function to get coordinates for the marker
                const coordinates = getEventCoordinates(event);
                
                // Only render marker if coordinates are valid
                return coordinates ? (
                  <Marker 
                    key={event.id}
                    longitude={coordinates.lng}
                    latitude={coordinates.lat}
                    anchor="center"
                  >
                    <div 
                      className="bg-[#1A1A1A] rounded-full p-1.5 shadow-md cursor-pointer border-2 border-gray-700 hover:border-[#C1FF2F] transition-colors" 
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleEventClick(event.id); }}
                      onMouseEnter={() => setHoveredEvent(event)} 
                      onMouseLeave={() => setHoveredEvent(null)} 
                      title={event.title} 
                    >
                      <span className="text-lg" role="img" aria-label={event.sportType}>
                        {SPORT_ICONS[event.sportType] || SPORT_ICONS['Default']}
                      </span>
                    </div>
                  </Marker>
                ) : null;
              })}
            </Map>
            
            {/* Custom Popup Div - Keep outside Map */}
            {hoveredEvent && popupPosition && (
              <div
                className="absolute z-10 transform -translate-x-1/2 -translate-y-full -mt-2 pointer-events-none"
                style={{ left: popupPosition.x, top: popupPosition.y }}
              >
                <div className="bg-[#1E1E1E] text-white rounded-lg shadow-lg overflow-hidden border border-gray-700 w-64">
                  <img 
                    src={getEventCoverImageUrl(hoveredEvent)} 
                    alt={hoveredEvent.title}
                    className="w-full h-24 object-cover"
                  />
                  <div className="p-3">
                    <h3 
                      className="font-semibold text-base mb-1 truncate" 
                      title={hoveredEvent.title}
                    >
                      {hoveredEvent.title.length > 35 ? hoveredEvent.title.substring(0, 35) + '...' : hoveredEvent.title}
                    </h3>
                    <div className="text-xs text-gray-400 space-y-1">
                      <div className="flex items-center">
                        <CalendarDaysIcon className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                        {formatEventDate(hoveredEvent.date)}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                        {formatEventTime(hoveredEvent.time)}
                      </div>
                      <div className="flex items-center">
                        <ScaleIcon className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                        Level: {hoveredEvent.level}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {!notificationsOnly && (
        <div className="hidden">
          <Filters
            onFilterChange={handleFilterChange}
            currentFilters={filters}
            showMobileFilters={showMobileFilters}
            onCloseMobileFilters={() => setShowMobileFilters(false)}
            isMobile
            hideSportTypeFilter={true}
            hideSearchBar={true}
          />
        </div>
      )}

      {showCreateDialog && (
        <CreateEventDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onEventCreated={() => {
            setShowCreateDialog(false);
          }}
        />
      )}

      {showEditDialog && selectedEventId && (
        <EditEventDialog
          open={showEditDialog}
          eventId={selectedEventId}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedEventId(null);
          }}
          onEventUpdated={() => {
            setShowEditDialog(false);
            setSelectedEventId(null);
          }}
        />
      )}

      {Object.values(missingFields).some(Boolean) && (
        <ProfileCompletionAlert 
          missingFields={missingFields} 
          onOpenProfile={() => setIsProfileDialogOpen(true)} 
        />
      )}

      {user && (
        <UserProfileDialog
          userId={user.uid}
          open={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
        />
      )}
    </div>
  );
};