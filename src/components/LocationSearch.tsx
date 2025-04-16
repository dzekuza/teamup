import React, { useState, useEffect, useRef } from 'react';

interface LocationSuggestion {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface LocationSearchProps {
  onLocationSelect: (location: LocationSuggestion) => void;
  placeholder?: string;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({ onLocationSelect, placeholder = "Search for a location" }) => {
  const [query, setQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // MapTiler API key
  const MAP_TILER_API_KEY = "33rTk4pHojFrbxONf77X"; // Use the same key as used elsewhere

  // Fetch location suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAP_TILER_API_KEY}&limit=5`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }
        
        const data = await response.json();
        const formattedSuggestions = data.features.map((feature: any) => ({
          name: feature.text,
          address: feature.place_name,
          coordinates: {
            lng: feature.center[0],
            lat: feature.center[1]
          }
        }));
        
        setSuggestions(formattedSuggestions);
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(() => {
      if (query) {
        fetchSuggestions();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle clicks outside the component to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    onLocationSelect(suggestion);
    setQuery(suggestion.address);
    setShowSuggestions(false);
  };

  return (
    <div ref={searchContainerRef} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        className="mt-1 block w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
      />
      
      {isLoading && (
        <div className="absolute right-3 top-3">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-[#C1FF2F]"></div>
        </div>
      )}
      
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-[#2A2A2A] border border-[#3A3A3A] rounded-xl shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-4 py-2 hover:bg-[#3A3A3A] cursor-pointer text-white"
            >
              <div className="font-medium">{suggestion.name}</div>
              <div className="text-sm text-gray-400">{suggestion.address}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationSearch; 