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
import { ChevronLeft as ChevronLeftIcon } from '@mui/icons-material';

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
    <div className="h-screen w-screen relative overflow-hidden">
      {/* Full-screen map as background */}
      <div className="absolute inset-0 z-0">
        <Map
            mapLib={Promise.resolve(maplibregl)}
            initialViewState={viewState}
            style={{ width: '100%', height: '100%' }}
            mapStyle="https://api.maptiler.com/maps/streets-v2-dark/style.json?key=33rTk4pHojFrbxONf77X"
            attributionControl={false}
          >
            {/* No need for transparent overlay since map is now interactive */}
            {filteredLocations.map((location, index) => (
              <Marker
                key={index}
                longitude={location.coordinates.lng}
                latitude={location.coordinates.lat}
              >
                <div 
                  className={`py-1 px-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                    hoveredLocationId === location.name || selectedLocation?.name === location.name 
                      ? 'bg-[#C1FF2F] text-black' 
                      : 'bg-[#2A2A2A]/80 text-white'
                  }`}
                  onClick={() => navigate(`/location/${encodeURIComponent(location.name)}`)}
                >
                  {location.name}
                </div>
              </Marker>
            ))}
          </Map>
      </div>

      {/* Left side panel for locations */}
      <div className="flex flex-grow w-full h-[calc(100vh-64px)] bg-black">
        {/* Left panel with search and location list */}
        <div className={`${isLeftPanelOpen ? 'w-[400px]' : 'w-0'} h-full transition-width duration-300 bg-black overflow-hidden relative`}>
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4">
              <h2 className="text-lg font-bold text-white">Locations</h2>
              {/* Toggle button for left panel */}
              <button 
                onClick={() => setIsLeftPanelOpen(false)}
                className="p-1 rounded-full hover:bg-gray-800"
              >
                <ChevronLeftIcon />
              </button>
            </div>
            
            {/* Location list container */}
            <div className="overflow-y-auto flex-grow py-4 my-4">
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
                      className={`p-4 cursor-pointer transition-all duration-200 border-b border-gray-800 last:border-b-0 ${
                        selectedLocation?.name === location.name 
                          ? 'bg-[#2A2A2A]' 
                          : hoveredLocationId === location.name
                            ? 'bg-[#1A1A1A]'
                            : 'hover:bg-[#1A1A1A]'
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
                                // Fallback image on error
                                (e.target as HTMLImageElement).src = "https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.appspot.com/o/Locations%2Fstatic%20cover.jpg?alt=media&token=4c319254-5854-4b3c-9bc7-e67cfe1a58b1";
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            {/* Make location name more visible with larger font and higher contrast */}
                            <h3 className="font-semibold text-lg text-white">{location.name}</h3>
                            <div className="flex items-center mt-1">
                              <div className="flex text-[#C1FF2F]">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="ml-1 text-xs">4.9, 200 reviews</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{location.address}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Location Info Overlay (if a location is selected) */}
      {selectedLocation && (
        <div className="absolute bottom-0 left-0 right-0 p-4 z-20 sm:left-1/3 lg:left-1/4">
          <div className="bg-[#1E1E1E] rounded-xl p-4 shadow-lg max-w-2xl mx-auto">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#C1FF2F]">{selectedLocation.name}</h2>
                <p className="text-sm text-gray-300 mt-1">{selectedLocation.address}</p>
              </div>
              <button
                onClick={() => navigate(`/location/${encodeURIComponent(selectedLocation.name)}`)}
                className="bg-[#C1FF2F] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#B1EF1F] transition-colors"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Dialog */}
      {selectedLocation && (
        <CreateEventDialog
          open={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onEventCreated={handleEventCreated}
        />
      )}

      {/* Toggle button for left panel - visible when panel is closed */}
      {!isLeftPanelOpen && (
        <button 
          onClick={() => setIsLeftPanelOpen(true)}
          className="absolute top-4 left-4 z-20 p-2 bg-black rounded-full hover:bg-gray-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      )}
    </div>
  );
};

export default Locations; 