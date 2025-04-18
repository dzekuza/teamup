import React, { useState, useEffect } from 'react';
import { PADEL_LOCATIONS, Location } from '../constants/locations';
import Map, { Marker } from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { LocationSearch } from '../components/LocationSearch';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Event } from '../types';
import { EventCard } from '../components/EventCard';
import { EventNote as EventIcon, ArrowCircleUp as ArrowUpIcon, Add as AddIcon, FilterAlt as FilterIcon, Search as SearchIcon } from '@mui/icons-material';
import { CreateEventDialog } from '../components/CreateEventDialog';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material';

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}

// Sport types for filtering
const SPORT_TYPES = [
  { id: 'all', name: 'All', icon: '🏆' },
  { id: 'Padel', name: 'Padel', icon: '🎾' },
  { id: 'Tennis', name: 'Tennis', icon: '🎾' },
  { id: 'Football', name: 'Football', icon: '⚽' },
  { id: 'Basketball', name: 'Basketball', icon: '🏀' },
];

// Helper function to recursively convert Firebase Timestamp objects to strings
const convertTimestampsToStrings = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // If it's a Timestamp or has toDate function, convert to ISO string
  if (obj instanceof Timestamp || (obj && typeof obj.toDate === 'function')) {
    try {
      if (obj.toDate) {
        return obj.toDate().toISOString();
      }
      return obj;
    } catch (error) {
      console.error('Error converting timestamp:', error);
      return obj;
    }
  }
  
  // If it's an array, convert each item
  if (Array.isArray(obj)) {
    return obj.map(item => convertTimestampsToStrings(item));
  }
  
  // If it's an object, convert each property
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = convertTimestampsToStrings(obj[key]);
      }
    }
    return newObj;
  }
  
  // Return primitive values as is
  return obj;
};

const Locations: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>({
    longitude: 25.2797, // Center on Vilnius by default
    latitude: 54.6872,
    zoom: 11
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [locationEvents, setLocationEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSportType, setSelectedSportType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  // Track the hovered location
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);

  // Check for mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter locations based on search term and sport type
  const filteredLocations = PADEL_LOCATIONS.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    // If 'all' is selected or the location doesn't have a sportType (assume it's Padel by default)
    const matchesSportType = selectedSportType === 'all' || 
                            (location.sportType && location.sportType === selectedSportType) ||
                            (!location.sportType && selectedSportType === 'Padel');
    
    return matchesSearch && matchesSportType;
  });

  // Fetch events for the selected location
  useEffect(() => {
    const fetchEventsForLocation = async () => {
      if (!selectedLocation) {
        setLocationEvents([]);
        return;
      }

      setIsLoading(true);
      try {
        const eventsQuery = query(
          collection(db, 'events'),
          where('location', '==', selectedLocation.name)
        );
        
        const querySnapshot = await getDocs(eventsQuery);
        const events: Event[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Apply the recursive conversion to handle all nested timestamps
          const processedData = convertTimestampsToStrings(data);
          
          const event = {
            id: doc.id,
            ...processedData,
            // These specific fields are crucial, ensure they're correctly formatted
            date: data.date && typeof data.date.toDate === 'function' ? 
              data.date.toDate().toISOString().split('T')[0] : processedData.date,
          };
          
          events.push(event as Event);
        });
        
        // Sort events by date (most recent first)
        events.sort((a, b) => {
          const dateA = new Date(a.date + 'T' + (a.time || '00:00'));
          const dateB = new Date(b.date + 'T' + (b.time || '00:00'));
          return dateA.getTime() - dateB.getTime();
        });
        
        setLocationEvents(events);
        setShowEvents(events.length > 0);
      } catch (error) {
        console.error('Error fetching events for location:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventsForLocation();
  }, [selectedLocation]);

  const handleLocationSelect = (location: any) => {
    setViewState({
      longitude: location.coordinates.lng,
      latitude: location.coordinates.lat,
      zoom: 14
    });
    
    // Find if this corresponds to one of our known locations
    const matchedLocation = PADEL_LOCATIONS.find(loc => 
      loc.name.toLowerCase().includes(location.name.toLowerCase()) ||
      loc.address.toLowerCase().includes(location.address.toLowerCase())
    );
    
    if (matchedLocation) {
      setSelectedLocation(matchedLocation);
    }
  };

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleEventUpdated = () => {
    // Refresh events for the selected location
    if (selectedLocation) {
      const fetchEvents = async () => {
        try {
          const eventsQuery = query(
            collection(db, 'events'),
            where('location', '==', selectedLocation.name)
          );
          
          const querySnapshot = await getDocs(eventsQuery);
          const events: Event[] = [];
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Apply the recursive conversion to handle all nested timestamps
            const processedData = convertTimestampsToStrings(data);
            
            const event = {
              id: doc.id,
              ...processedData,
              // These specific fields are crucial, ensure they're correctly formatted
              date: data.date && typeof data.date.toDate === 'function' ? 
                data.date.toDate().toISOString().split('T')[0] : processedData.date,
            };
            
            events.push(event as Event);
          });
          
          events.sort((a, b) => {
            const dateA = new Date(a.date + 'T' + (a.time || '00:00'));
            const dateB = new Date(b.date + 'T' + (b.time || '00:00'));
            return dateA.getTime() - dateB.getTime();
          });
          
          setLocationEvents(events);
        } catch (error) {
          console.error('Error refreshing events:', error);
        }
      };
      
      fetchEvents();
    }
  };

  const handleEventCreated = () => {
    setIsCreateDialogOpen(false);
    handleEventUpdated();
  };

  // When the user opens the create event dialog, ensure the selected location is pre-selected
  // Note: We can't pass defaultLocation as a prop, so we'll rely on the global event to handle it
  useEffect(() => {
    // This effect will run when the dialog is opened
    if (isCreateDialogOpen && selectedLocation) {
      // The CreateEventDialog component will need to check localStorage for this value
      localStorage.setItem('preselectedLocation', selectedLocation.name);
    }
  }, [isCreateDialogOpen, selectedLocation]);

  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#121212] pb-8 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-8">
        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-10rem)]">
          <div className={`${isLeftPanelOpen ? 'w-full md:w-[400px]' : 'w-0'} h-full transition-all duration-300 bg-[#1A1A1A] rounded-lg overflow-hidden relative flex flex-col`}>
            {isLeftPanelOpen && (
              <>
                <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                  <h2 className="text-lg font-bold text-white">Locations</h2>
                  <button 
                    onClick={() => setIsLeftPanelOpen(false)}
                    className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 md:block hidden"
                    aria-label="Close locations panel"
                  >
                    <ChevronLeftIcon />
                  </button>
                </div>

                <div className="p-4 border-b border-gray-700 flex-shrink-0">
                  <input 
                    type="text" 
                    placeholder="Search locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 rounded-md bg-[#2A2A2A] text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#C1FF2F]"
                  />
                </div>

                <div className="overflow-y-auto flex-grow">
                  {filteredLocations.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-gray-400">No venues match your search criteria</p>
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedSportType('all');
                        }}
                        className="mt-4 bg-[#2A2A2A] text-white px-4 py-2 rounded-lg hover:bg-[#3A3A3A]"
                      >
                        Clear Filters
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-800">
                      {filteredLocations.map((location, index) => (
                        <div 
                          key={index} 
                          className={`p-4 cursor-pointer transition-colors duration-150 ${ 
                            selectedLocation?.name === location.name 
                              ? 'bg-[#2A2A2A]'
                              : hoveredLocationId === location.name
                                ? 'bg-[#222222]'
                                : 'hover:bg-[#1F1F1F]'
                          }`}
                          onClick={() => navigate(`/location/${encodeURIComponent(location.name)}`)}
                          onMouseEnter={() => setHoveredLocationId(location.name)}
                          onMouseLeave={() => setHoveredLocationId(null)}
                        >
                          <div className="flex flex-col">
                            <div className="flex items-start">
                              <div className="w-20 h-20 rounded-lg overflow-hidden mr-3 flex-shrink-0">
                                <img 
                                  src={location.image} 
                                  alt={location.name} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.appspot.com/o/Locations%2Fstatic%20cover.jpg?alt=media&token=4c319254-5854-4b3c-9bc7-e67cfe1a58b1";
                                  }}
                                />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-base text-white mb-1">{location.name}</h3>
                                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{location.address}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex-1 h-full rounded-lg overflow-hidden relative">
            {!isLeftPanelOpen && (
              <button 
                onClick={() => setIsLeftPanelOpen(true)}
                className="absolute top-4 left-4 z-20 p-2 bg-[#1A1A1A]/80 backdrop-blur-sm text-white rounded-full hover:bg-gray-800 transition-colors shadow-md"
                aria-label="Open locations panel"
              >
                <ChevronRightIcon />
              </button>
            )}
            
            <Map
              {...({
                initialViewState: viewState,
                onMove: (evt: any) => setViewState(evt.viewState), 
                style: { width: '100%', height: '100%' },
                mapLib: Promise.resolve(maplibregl),
                mapStyle: "https://api.maptiler.com/maps/streets-v2-dark/style.json?key=33rTk4pHojFrbxONf77X",
                children: (
                  <>
                    {filteredLocations.map((location, index) => (
                      <Marker
                        key={index}
                        longitude={location.coordinates.lng}
                        latitude={location.coordinates.lat}
                      >
                        <div 
                          className={`py-1 px-2 rounded-md text-xs font-medium transition-colors cursor-pointer shadow ${ 
                            hoveredLocationId === location.name || selectedLocation?.name === location.name 
                              ? 'bg-[#C1FF2F] text-black' 
                              : 'bg-[#2A2A2A]/80 text-white backdrop-blur-sm'
                          }`}
                          onClick={() => navigate(`/location/${encodeURIComponent(location.name)}`)}
                          onMouseEnter={() => setHoveredLocationId(location.name)}
                          onMouseLeave={() => setHoveredLocationId(null)}
                        >
                          {location.name}
                        </div>
                      </Marker>
                    ))}
                  </>
                )
              } as any)} 
            />
          </div>
        </div>
      </div>

      {selectedLocation && (
        <CreateEventDialog
          open={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onEventCreated={handleEventCreated}
        />
      )}
    </div>
  );
};

export default Locations; 