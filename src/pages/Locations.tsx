import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Marker } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Firebase imports
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

// Components
import { LocationSearch } from '../components/LocationSearch';
import { EventCard } from '../components/EventCard';
import { CreateEventDialog } from '../components/CreateEventDialog';

// Icons
import { FilterAlt as FilterIcon, Search as SearchIcon } from '@mui/icons-material';
import { ChevronRight as ChevronRightIcon } from '@mui/icons-material';

// Types and constants
import { PADEL_LOCATIONS, Location } from '../constants/locations';
import { Event } from '../types';
import type { MapOptions } from 'maplibre-gl';

type ViewState = {
  longitude: number;
  latitude: number;
  zoom: number;
};

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

const Locations = () => {
  const [viewState, setViewState] = useState<ViewState>({
    longitude: 25.2797,
    latitude: 54.6872,
    zoom: 11
  });
  const mapRef = useRef<MapRef>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [locationEvents, setLocationEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [selectedSportType, setSelectedSportType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);
  const navigate = useNavigate();

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
    const matchesSport = selectedSportType === 'all' || location.sportType === selectedSportType;
    return matchesSearch && matchesSport;
  });

  useEffect(() => {
    if (!selectedLocation) return;
    fetchLocationEvents(selectedLocation);
  }, [selectedLocation]);

  const fetchLocationEvents = async (location: Location) => {
    setIsLoading(true);
    try {
      const eventsRef = collection(db, 'events');
      const q = query(
        eventsRef,
        where('location', '==', location.name),
        where('status', '==', 'active'),
        orderBy('date', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const events = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestampsToStrings(doc.data())
      })) as Event[];
      
      setLocationEvents(events);
    } catch (error) {
      console.error('Error fetching location events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = (location: Location) => {
    setViewState({
      longitude: location.coordinates.lng,
      latitude: location.coordinates.lat,
      zoom: 15
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

  const handleMapMove = useCallback((evt: { viewState: ViewState }) => {
    setViewState(evt.viewState);
  }, []);

  const handleMarkerClick = (location: Location, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLocation(location);
    setViewState({
      longitude: location.coordinates.lng,
      latitude: location.coordinates.lat,
      zoom: 14
    });
    fetchLocationEvents(location);
  };

  const handleLocationClick = (location: Location) => {
    setSelectedLocation(location);
    setViewState({
      longitude: location.coordinates.lng,
      latitude: location.coordinates.lat,
      zoom: 14
    });
  };

  return (
    <div className="fixed inset-0 bg-[#121212] text-white">
      {/* Left Panel */}
      <div className={`
        fixed left-0 top-0 bottom-0 bg-[#1A1A1A] z-10
        transition-transform duration-300 ease-in-out
        ${isMobile ? 'w-full' : 'w-96'}
        transform ${showEvents ? 'translate-x-0' : (isMobile ? '-translate-x-full' : 'translate-x-0')}
      `}>
        <div className="h-full flex flex-col">
          {/* Search and Filters */}
          <div className="p-4 space-y-4 bg-[#1A1A1A] sticky top-0 z-10">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search locations..."
                className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
              />
              <SearchIcon className="absolute left-3 top-3 text-gray-400" />
            </div>

            {/* Sport Type Filter */}
            <div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-gray-300 hover:text-white"
              >
                <FilterIcon />
                <span>Filters</span>
              </button>
              
              {showFilters && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {SPORT_TYPES.map(sport => (
                    <button
                      key={sport.id}
                      onClick={() => setSelectedSportType(sport.id)}
                      className={`
                        px-3 py-1 rounded-full text-sm font-medium
                        ${selectedSportType === sport.id
                          ? 'bg-[#C1FF2F] text-black'
                          : 'bg-[#2A2A2A] text-white hover:bg-[#3A3A3A]'}
                      `}
                    >
                      {sport.icon} {sport.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Locations List */}
          <div className="flex-1 overflow-y-auto">
            <div className="divide-y divide-gray-800">
              {filteredLocations.length === 0 ? (
                <div className="p-8 text-center">
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
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{location.name}</h3>
                            <p className="text-gray-400 text-sm mt-1">{location.address}</p>
                            {location.sportType && (
                              <span className="inline-block mt-2 bg-[#2A2A2A] px-2 py-1 rounded-full text-xs font-medium">
                                {location.sportType}
                              </span>
                            )}
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

      {/* Map Container */}
      <div className="fixed inset-0 z-0">
        <div className={`absolute inset-0 ${isMobile ? 'left-0' : 'left-96'}`}>
          {/* Mobile Toggle Button */}
          {isMobile && !showEvents && (
            <button
              onClick={() => setShowEvents(true)}
              className="absolute top-4 left-4 z-20 p-2 bg-[#1A1A1A]/80 backdrop-blur-sm text-white rounded-full hover:bg-gray-800 transition-colors shadow-md"
              aria-label="Open locations panel"
            >
              <ChevronRightIcon />
            </button>
          )}
          <Map
            ref={mapRef}
            initialViewState={{
              longitude: 25.2797,
              latitude: 54.6872,
              zoom: 11
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="https://api.maptiler.com/maps/basic-v2-dark/style.json?key=hbw4PJCpzzoJ3dKo6XQx"
            onMove={handleMapMove}
          >
            {filteredLocations.map(location => (
              <Marker 
                key={location.name}
                longitude={location.coordinates.lng}
                latitude={location.coordinates.lat}
                anchor="center"
              >
                <div 
                  className={`bg-[#1A1A1A] rounded-full p-2 shadow-md cursor-pointer border-2 ${
                    hoveredLocationId === location.name ? 'border-[#C1FF2F]' : 'border-gray-700'
                  } hover:border-[#C1FF2F] transition-colors`} 
                  onClick={(e) => handleMarkerClick(location, e)}
                  onMouseEnter={() => setHoveredLocationId(location.name)} 
                  onMouseLeave={() => setHoveredLocationId(null)} 
                  title={location.name} 
                >
                  <span className="text-xl" role="img" aria-label={location.sportType || 'Padel'}>
                    {location.sportType === 'Tennis' ? '🎾' :
                     location.sportType === 'Football' ? '⚽' :
                     location.sportType === 'Basketball' ? '🏀' :
                     location.sportType === 'Padel' ? '🎾' : '🎾'}
                  </span>
                </div>
              </Marker>
            ))}
          </Map>
        </div>
      </div>
    </div>
  );
};

export default Locations; 