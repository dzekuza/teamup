import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { PADEL_LOCATIONS } from '../constants/locations';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const SPORTS = [
  { id: 'Padel', name: 'Padel', icon: '🎾' },
  { id: 'Tennis', name: 'Tennis', icon: '🎾' },
  { id: 'Running', name: 'Running', icon: '🏃' },
  { id: 'Soccer', name: 'Soccer', icon: '⚽' },
  { id: 'Basketball', name: 'Basketball', icon: '🏀' },
  { id: 'Cycling', name: 'Cycling', icon: '🚴' },
];

export interface FilterOptions {
  date: string;
  level: string;
  location: string;
  showJoinedOnly: boolean;
  searchTerm: string;
  sportType: string;
}

export interface FiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
  showMobileFilters: boolean;
  onCloseMobileFilters: () => void;
  currentFilters: FilterOptions;
  isMobile?: boolean;
}

const FilterContent: React.FC<FiltersProps> = ({ onFilterChange, currentFilters }) => {
  const handleFilterChange = (key: keyof FilterOptions, value: string | boolean) => {
    onFilterChange({
      ...currentFilters,
      [key]: value,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
      {/* Search field */}
      <div className="md:col-span-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            id="search"
            value={currentFilters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            placeholder="Search by title, location, or players..."
            className="w-full bg-[#1A1A1A] text-white border border-gray-800 rounded-lg pl-10 p-2 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F] focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <select
          id="sportType"
          value={currentFilters.sportType}
          onChange={(e) => handleFilterChange('sportType', e.target.value)}
          className="w-full bg-[#1A1A1A] text-white border border-gray-800 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F] focus:border-transparent"
        >
          <option value="">All sports</option>
          {SPORTS.map((sport) => (
            <option key={sport.id} value={sport.id}>
              {sport.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <select
          id="date"
          value={currentFilters.date}
          onChange={(e) => handleFilterChange('date', e.target.value)}
          className="w-full bg-[#1A1A1A] text-white border border-gray-800 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F] focus:border-transparent"
        >
          <option value="">All dates</option>
          <option value="today">Today</option>
          <option value="tomorrow">Tomorrow</option>
          <option value="this-week">This week</option>
          <option value="next-week">Next week</option>
        </select>
      </div>

      <div>
        <select
          id="level"
          value={currentFilters.level}
          onChange={(e) => handleFilterChange('level', e.target.value)}
          className="w-full bg-[#1A1A1A] text-white border border-gray-800 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F] focus:border-transparent"
        >
          <option value="">All levels</option>
          {LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>

      <div>
        <select
          id="location"
          value={currentFilters.location}
          onChange={(e) => handleFilterChange('location', e.target.value)}
          className="w-full bg-[#1A1A1A] text-white border border-gray-800 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F] focus:border-transparent"
        >
          <option value="">All locations</option>
          {PADEL_LOCATIONS.map((location) => (
            <option key={location.name} value={location.name}>
              {location.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center">
        <div className="flex items-center h-full">
          <input
            id="showJoinedOnly"
            type="checkbox"
            checked={currentFilters.showJoinedOnly}
            onChange={(e) => handleFilterChange('showJoinedOnly', e.target.checked)}
            className="h-4 w-4 text-[#C1FF2F] bg-[#1A1A1A] border-gray-800 rounded focus:ring-[#C1FF2F] focus:ring-offset-gray-900"
          />
          <label htmlFor="showJoinedOnly" className="ml-2 text-sm text-gray-400">
            Show only events I've joined
          </label>
        </div>
      </div>
    </div>
  );
};

export const Filters: React.FC<FiltersProps> = ({
  onFilterChange,
  showMobileFilters,
  onCloseMobileFilters,
  currentFilters,
  isMobile = false,
}) => {
  if (!isMobile) {
    return <FilterContent onFilterChange={onFilterChange} currentFilters={currentFilters} showMobileFilters={showMobileFilters} onCloseMobileFilters={onCloseMobileFilters} />;
  }

  return (
    <Transition.Root show={showMobileFilters} as={React.Fragment}>
      <Dialog as="div" className="fixed inset-0 z-[100] md:hidden" onClose={onCloseMobileFilters}>
        <div className="fixed inset-0 flex">
          {/* Overlay */}
          <Transition.Child
            as={React.Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          {/* Sliding panel */}
          <Transition.Child
            as={React.Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="fixed right-0 top-0 bottom-0 w-full max-w-xs flex flex-col overflow-y-auto bg-[#121212] py-4 pb-6 shadow-xl">
              <div className="flex items-center justify-between px-4 pb-4 border-b border-gray-800">
                <h2 className="text-lg font-medium text-white">Filters</h2>
                <button
                  type="button"
                  className="text-gray-400 hover:text-white"
                  onClick={onCloseMobileFilters}
                >
                  <span className="sr-only">Close menu</span>
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="p-4">
                <FilterContent
                  onFilterChange={onFilterChange}
                  currentFilters={currentFilters}
                  showMobileFilters={showMobileFilters}
                  onCloseMobileFilters={onCloseMobileFilters}
                />
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}; 