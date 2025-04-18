import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { PADEL_LOCATIONS } from '../constants/locations';
import { Input } from './ui/input';
import { Select } from './ui/select';
// Remove the BottomSheet import
// import { BottomSheet } from 'react-spring-bottom-sheet';
// Remove the import styles comment
// Import the styles for the bottom sheet
// import 'react-spring-bottom-sheet/dist/style.css';

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
  eventStatus: string;
}

export interface FiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
  showMobileFilters: boolean;
  onCloseMobileFilters: () => void;
  currentFilters: FilterOptions;
  isMobile?: boolean;
  hideSportTypeFilter?: boolean;
  hideSearchBar?: boolean;
}

const FilterContent: React.FC<FiltersProps> = ({ onFilterChange, currentFilters, showMobileFilters, onCloseMobileFilters, hideSportTypeFilter, hideSearchBar }) => {
  const handleFilterChange = (key: keyof FilterOptions, value: string | boolean) => {
    onFilterChange({
      ...currentFilters,
      [key]: value,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-center">
      {/* Search field - use Input component */}
      {!hideSearchBar && (
        <div className="md:col-span-2">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <Input
              type="text"
              id="search"
              value={currentFilters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              placeholder="Search by title, location, or players..."
              className="pl-10 bg-[#1A1A1A] text-white border-gray-800 focus:ring-[#C1FF2F]"
            />
          </div>
        </div>
      )}

      {/* Use styled Select component for Event Status */}
      <Select
        id="eventStatus"
        value={currentFilters.eventStatus}
        onChange={(e) => handleFilterChange('eventStatus', e.target.value)}
        className="w-full bg-[#1A1A1A] text-white border border-gray-800 focus:ring-[#C1FF2F]"
      >
        <option value="active">Active Events</option>
        <option value="completed">Completed Events</option>
      </Select>

      {/* Sport Type Filter - only show if not hidden */}
      {!hideSportTypeFilter && (
        <Select
          id="sportType"
          value={currentFilters.sportType}
          onChange={(e) => handleFilterChange('sportType', e.target.value)}
          className="w-full bg-[#1A1A1A] text-white border border-gray-800 focus:ring-[#C1FF2F]"
        >
          <option value="">All sports</option>
          {SPORTS.map((sport) => (
            <option key={sport.id} value={sport.id}>
              {sport.name}
            </option>
          ))}
        </Select>
      )}

      {/* Use styled Select component for Date */}
      <Select
        id="date"
        value={currentFilters.date}
        onChange={(e) => handleFilterChange('date', e.target.value)}
        className="w-full bg-[#1A1A1A] text-white border border-gray-800 focus:ring-[#C1FF2F]"
      >
        <option value="">All dates</option>
        <option value="today">Today</option>
        <option value="tomorrow">Tomorrow</option>
        <option value="this-week">This week</option>
        <option value="next-week">Next week</option>
      </Select>

      {/* Use styled Select component for Level */}
      <Select
        id="level"
        value={currentFilters.level}
        onChange={(e) => handleFilterChange('level', e.target.value)}
        className="w-full bg-[#1A1A1A] text-white border border-gray-800 focus:ring-[#C1FF2F]"
      >
        <option value="">All levels</option>
        {LEVELS.map((level) => (
          <option key={level} value={level}>
            {level}
          </option>
        ))}
      </Select>

      {/* Use styled Select component for Location */}
      <Select
        id="location"
        value={currentFilters.location}
        onChange={(e) => handleFilterChange('location', e.target.value)}
        className="w-full bg-[#1A1A1A] text-white border border-gray-800 focus:ring-[#C1FF2F]"
      >
        <option value="">All locations</option>
        {PADEL_LOCATIONS.map((location) => (
          <option key={location.name} value={location.name}>
            {location.name}
          </option>
        ))}
      </Select>

      {/* Toggle Buttons with Sliding Highlight */}
      <div className="flex items-center h-10 md:col-span-2">
        {/* Outer container - relative positioning context */}
        <div className="relative flex items-center border border-gray-800 rounded-full bg-[#1A1A1A] p-1 w-full">
          {/* Sliding Highlight */}
          <div
            className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-[#C1FF2F] transition-transform duration-300 ease-in-out ${ 
              currentFilters.showJoinedOnly ? 'translate-x-full' : 'translate-x-0' 
            }`}
            style={{ transform: currentFilters.showJoinedOnly ? 'translateX(calc(100% + 4px))' : 'translateX(0)' }} // Precise sliding accounting for padding
          />
          {/* Buttons - positioned above highlight */}
          <button
            className={`relative z-10 flex-1 py-1.5 px-3 text-sm font-medium transition-colors duration-300 ease-in-out ${ 
              !currentFilters.showJoinedOnly ? 'text-black' : 'text-white hover:text-gray-300' 
            }`}
            onClick={() => handleFilterChange('showJoinedOnly', false)}
          >
            All events
          </button>
          <button
            className={`relative z-10 flex-1 py-1.5 px-3 text-sm font-medium transition-colors duration-300 ease-in-out ${ 
              currentFilters.showJoinedOnly ? 'text-black' : 'text-white hover:text-gray-300' 
            }`}
            onClick={() => handleFilterChange('showJoinedOnly', true)}
          >
            Joined
          </button>
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
  hideSportTypeFilter,
  hideSearchBar
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Show/hide animation logic
  useEffect(() => {
    if (showMobileFilters) {
      setIsVisible(true);
    } else {
      // Add a delay to allow the animation to complete before hiding
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showMobileFilters]);

  // Handle touch start event
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
    setTouchEnd(null);
  };
  
  // Handle touch move event
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };
  
  // Handle touch end event to determine swipe direction
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    // Determine distance of swipe
    const distance = touchEnd - touchStart;
    
    // If distance is greater than 100px, consider it a swipe down
    if (distance > 100) {
      onCloseMobileFilters();
    }
    
    // Reset touch values
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (!isMobile) {
    return <FilterContent 
      onFilterChange={onFilterChange} 
      currentFilters={currentFilters} 
      showMobileFilters={showMobileFilters} 
      onCloseMobileFilters={onCloseMobileFilters}
      hideSportTypeFilter={hideSportTypeFilter}
      hideSearchBar={hideSearchBar}
    />;
  }

  return (
    <div className="md:hidden">
      <button
        onClick={onCloseMobileFilters}
        className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-[#1A1A1A] rounded-lg border border-gray-800 focus:outline-none"
      >
        <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
        Filters
      </button>

      <Transition show={isVisible}>
        <Dialog
          open={isVisible}
          onClose={onCloseMobileFilters}
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as="div"
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black opacity-30" />
            </Transition.Child>

            {/* Bottom Sheet */}
            <Transition.Child
              as="div"
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-full"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-full"
              className="fixed bottom-0 inset-x-0 transform transition-all"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="bg-neutral-900 rounded-t-2xl shadow-xl p-6 w-full max-w-lg mx-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-white">Filters</h3>
                  <button
                    onClick={onCloseMobileFilters}
                    className="text-gray-400 hover:text-white focus:outline-none"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                {/* Drag handle */}
                <div className="absolute top-3 left-0 right-0 flex justify-center">
                  <div className="w-12 h-1 bg-gray-600 rounded-full"></div>
                </div>
                
                <FilterContent 
                  onFilterChange={onFilterChange} 
                  currentFilters={currentFilters}
                  showMobileFilters={showMobileFilters}
                  onCloseMobileFilters={onCloseMobileFilters}
                  hideSportTypeFilter={hideSportTypeFilter}
                  hideSearchBar={hideSearchBar}
                />
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}; 