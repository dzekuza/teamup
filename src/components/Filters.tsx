import React, { useState } from 'react';
import { PADEL_LOCATIONS } from '../constants/locations';

interface FiltersProps {
  onFilterChange: (filters: {
    date: string;
    level: string;
    location: string;
    showJoinedOnly: boolean;
  }) => void;
}

export const Filters: React.FC<FiltersProps> = ({ onFilterChange }) => {
  const [date, setDate] = useState('');
  const [level, setLevel] = useState('');
  const [location, setLocation] = useState('');
  const [showJoinedOnly, setShowJoinedOnly] = useState(false);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDate(newDate);
    onFilterChange({ date: newDate, level, location, showJoinedOnly });
  };

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLevel = e.target.value;
    setLevel(newLevel);
    onFilterChange({ date, level: newLevel, location, showJoinedOnly });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocation = e.target.value;
    setLocation(newLocation);
    onFilterChange({ date, level, location: newLocation, showJoinedOnly });
  };

  const handleShowJoinedOnlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newShowJoinedOnly = e.target.checked;
    setShowJoinedOnly(newShowJoinedOnly);
    onFilterChange({ date, level, location, showJoinedOnly: newShowJoinedOnly });
  };

  return (
    <div className="w-full md:w-2/3 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={handleDateChange}
            className="w-full bg-[#2A2A2A] text-white rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
            style={{ colorScheme: 'dark' }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Level</label>
          <select
            value={level}
            onChange={handleLevelChange}
            className="w-full bg-[#2A2A2A] text-white rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
          >
            <option value="">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Location</label>
          <select
            value={location}
            onChange={handleLocationChange}
            className="w-full bg-[#2A2A2A] text-white rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
          >
            <option value="">All Locations</option>
            {PADEL_LOCATIONS.map((loc) => (
              <option key={loc.name} value={loc.name}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showJoinedOnly}
              onChange={handleShowJoinedOnlyChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#2A2A2A] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#C1FF2F] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C1FF2F]"></div>
            <span className="ml-3 text-sm font-medium text-gray-400">Show joined only</span>
          </label>
        </div>
      </div>
    </div>
  );
}; 