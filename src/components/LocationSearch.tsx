import React, { useEffect, useRef } from 'react';
import { Location } from '../constants/locations';

interface LocationSearchProps {
  onLocationSelect: (location: Location) => void;
  placeholder?: string;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({ onLocationSelect, placeholder = "Search for a location..." }) => {
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchRef.current) return;

    const searchInput = searchRef.current;
    const handleSearch = async () => {
      const query = searchInput.value;
      if (!query) return;

      try {
        const response = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=hbw4PJCpzzoJ3dKo6XQx&country=LT`);
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          const firstResult = data.features[0];
          const location: Location = {
            name: firstResult.place_name,
            address: firstResult.place_name,
            coordinates: {
              lng: firstResult.center[0],
              lat: firstResult.center[1]
            },
            image: '', // You might want to set a default image
            sportType: 'Other'
          };
          onLocationSelect(location);
        }
      } catch (error) {
        console.error('Error searching location:', error);
      }
    };

    let debounceTimer: NodeJS.Timeout;
    const handleInput = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(handleSearch, 500);
    };

    searchInput.addEventListener('input', handleInput);
    return () => {
      searchInput.removeEventListener('input', handleInput);
      clearTimeout(debounceTimer);
    };
  }, [onLocationSelect]);

  return (
    <div className="relative">
      <input
        ref={searchRef}
        type="text"
        placeholder={placeholder}
        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
};

export default LocationSearch; 