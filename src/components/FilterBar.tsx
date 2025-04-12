import React from 'react';

const PADEL_LOCATIONS = [
  'Padel Vilnius - Liepkalnio g. 2C, Vilnius 02105',
  'Ozo Padel & Tennis - Ozo g. 14C, Vilnius 08200',
  'SET Padel Club - Kareivių g. 14, Vilnius 09117',
  'Tennis Pro Academy Padel - Naugarduko g. 76, Vilnius 03202',
  'GO9 Padel - Gedimino pr. 9, Vilnius 01103',
  'Padel House Vilnius - Žygio g. 97A, Vilnius 08234',
  'LTU Padel Club - Viršuliškių g. 40, Vilnius 05131'
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

interface FilterBarProps {
  filters: {
    date: string;
    level: string;
    location: string;
  };
  onFilterChange: (name: string, value: string) => void;
  onClearFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-[#1E1E1E] rounded-3xl p-6 mb-8">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-gray-400 text-sm mb-2">Date</label>
          <input
            type="date"
            min={today}
            value={filters.date}
            onChange={(e) => onFilterChange('date', e.target.value)}
            className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F] appearance-none"
            style={{
              colorScheme: 'dark'
            }}
          />
        </div>

        <div className="flex-1 relative">
          <label className="block text-gray-400 text-sm mb-2">Level</label>
          <select
            value={filters.level}
            onChange={(e) => onFilterChange('level', e.target.value)}
            className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F] appearance-none"
          >
            <option value="">All levels</option>
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 pt-6">
            <svg className="fill-current h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>

        <div className="flex-1 relative">
          <label className="block text-gray-400 text-sm mb-2">Location</label>
          <select
            value={filters.location}
            onChange={(e) => onFilterChange('location', e.target.value)}
            className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F] appearance-none"
          >
            <option value="">All locations</option>
            {PADEL_LOCATIONS.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 pt-6">
            <svg className="fill-current h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>

      {(filters.date || filters.level || filters.location) && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClearFilters}
            className="text-[#C1FF2F] hover:underline text-sm"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}; 