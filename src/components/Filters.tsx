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

// FilterContent component for Desktop Grid
const FilterContent: React.FC<Omit<FiltersProps, 'isMobile'>> = ({ onFilterChange, currentFilters, showMobileFilters, onCloseMobileFilters, hideSportTypeFilter, hideSearchBar }) => {

  const handleChange = (key: keyof FilterOptions, value: string | boolean) => {
    onFilterChange({ ...currentFilters, [key]: value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-center">
       {!hideSearchBar && (
         <div className="md:col-span-2">
           <div className="relative">
             <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
             <Input
               type="text"
               id="search"
               value={currentFilters.searchTerm}
               onChange={(e) => handleChange('searchTerm', e.target.value)}
               placeholder="Search by title, location, or players..."
               className="pl-10 bg-[#1A1A1A] text-white border-gray-800 focus:ring-[#C1FF2F]"
             />
           </div>
         </div>
       )}
       <Select
         id="eventStatus"
         value={currentFilters.eventStatus}
         onChange={(e) => handleChange('eventStatus', e.target.value)}
         className="w-full bg-[#1A1A1A] text-white border border-gray-800 focus:ring-[#C1FF2F] rounded-md"
       >
         <option value="active">Active Events</option>
         <option value="completed">Completed Events</option>
       </Select>
       {!hideSportTypeFilter && (
         <Select
           id="sportType"
           value={currentFilters.sportType}
           onChange={(e) => handleChange('sportType', e.target.value)}
           className="w-full bg-[#1A1A1A] text-white border border-gray-800 focus:ring-[#C1FF2F] rounded-md"
         >
           <option value="">All sports</option>
           {SPORTS.map((sport) => (
             <option key={sport.id} value={sport.id}>
               {sport.name}
             </option>
           ))}
         </Select>
       )}
       <Select
         id="date"
         value={currentFilters.date}
         onChange={(e) => handleChange('date', e.target.value)}
         className="w-full bg-[#1A1A1A] text-white border border-gray-800 focus:ring-[#C1FF2F] rounded-md"
       >
         <option value="">All dates</option>
         <option value="today">Today</option>
         <option value="tomorrow">Tomorrow</option>
         <option value="this-week">This week</option>
         <option value="next-week">Next week</option>
       </Select>
       <Select
         id="level"
         value={currentFilters.level}
         onChange={(e) => handleChange('level', e.target.value)}
         className="w-full bg-[#1A1A1A] text-white border border-gray-800 focus:ring-[#C1FF2F] rounded-md"
       >
         <option value="">All levels</option>
         {LEVELS.map((level) => (
           <option key={level} value={level}>
             {level}
           </option>
         ))}
       </Select>
       <Select
         id="location"
         value={currentFilters.location}
         onChange={(e) => handleChange('location', e.target.value)}
         className="w-full bg-[#1A1A1A] text-white border border-gray-800 focus:ring-[#C1FF2F] rounded-md"
       >
         <option value="">All locations</option>
         {PADEL_LOCATIONS.map((location) => (
           <option key={location.name} value={location.name}>
             {location.name}
           </option>
         ))}
       </Select>
       <div className="flex items-center h-10 md:col-span-2">
         <div className="relative flex items-center border border-gray-800 rounded-full bg-[#1A1A1A] p-1 w-full">
           <div
             className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-[#C1FF2F] transition-transform duration-300 ease-in-out ${ 
               currentFilters.showJoinedOnly ? 'translate-x-full' : 'translate-x-0' 
             }`}
             style={{ transform: currentFilters.showJoinedOnly ? 'translateX(calc(100% + 4px))' : 'translateX(0)' }}
           />
           <button
             className={`relative z-10 flex-1 py-1.5 px-3 text-sm font-medium transition-colors duration-300 ease-in-out ${ 
               !currentFilters.showJoinedOnly ? 'text-black' : 'text-white hover:text-gray-300' 
             }`}
             onClick={() => handleChange('showJoinedOnly', false)}
           >
             All events
           </button>
           <button
             className={`relative z-10 flex-1 py-1.5 px-3 text-sm font-medium transition-colors duration-300 ease-in-out ${ 
               currentFilters.showJoinedOnly ? 'text-black' : 'text-white hover:text-gray-300' 
             }`}
             onClick={() => handleChange('showJoinedOnly', true)}
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
  hideSearchBar,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
      setIsVisible(showMobileFilters);
  }, [showMobileFilters]);

  if (!isMobile) {
    // Pass the parent's onFilterChange down to FilterContent
    return <FilterContent 
      onFilterChange={onFilterChange} 
      currentFilters={currentFilters} 
      showMobileFilters={false} 
      onCloseMobileFilters={() => {}} 
      hideSportTypeFilter={hideSportTypeFilter}
      hideSearchBar={hideSearchBar}
    />;
  }

  return (
    <Transition show={isVisible} as={React.Fragment}>
      <Dialog
        open={isVisible} 
        onClose={onCloseMobileFilters} 
        className="fixed inset-0 z-50 overflow-y-auto md:hidden" 
      >
        {/* ... Transition.Child for overlay ... */}
         <Transition.Child
           as={React.Fragment}
           enter="ease-out duration-300"
           enterFrom="opacity-0"
           enterTo="opacity-100"
           leave="ease-in duration-200"
           leaveFrom="opacity-100"
           leaveTo="opacity-0"
         >
           <div className="fixed inset-0 bg-black bg-opacity-50" aria-hidden="true" />
         </Transition.Child>

        {/* Modal Panel */}
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 translate-y-full"
          enterTo="opacity-100 translate-y-0"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-full"
        >
          <Dialog.Panel className="fixed bottom-0 inset-x-0 bg-[#121212] rounded-t-2xl shadow-xl flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
              <Dialog.Title className="text-lg font-semibold text-white">Filters</Dialog.Title>
              <button
                onClick={onCloseMobileFilters}
                className="p-1 text-gray-400 hover:text-white"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Scrollable Filter Content Area - Restore original filters */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {/* Remove Sort Section */}
              {/* Remove Distance Section */}

              {/* Restore original filters - adapt styling for vertical layout */}
              <Select
                id="eventStatus-mobile"
                value={currentFilters.eventStatus}
                onChange={(e) => onFilterChange({ ...currentFilters, eventStatus: e.target.value })}
                className="w-full bg-[#1A1A1A] text-white border border-gray-800 focus:ring-[#C1FF2F] rounded-md"
              >
                <option value="active">Active Events</option>
                <option value="completed">Completed Events</option>
              </Select>
              
              {!hideSportTypeFilter && (
                <Select
                  id="sportType-mobile"
                  value={currentFilters.sportType}
                  onChange={(e) => onFilterChange({ ...currentFilters, sportType: e.target.value })}
                  className="w-full bg-[#1A1A1A] text-white border border-gray-800 focus:ring-[#C1FF2F] rounded-md"
                >
                  <option value="">All sports</option>
                  {SPORTS.map((sport) => (
                    <option key={sport.id} value={sport.id}>{sport.name}</option>
                  ))}
                </Select>
              )}

              <Select
                id="date-mobile"
                value={currentFilters.date}
                onChange={(e) => onFilterChange({ ...currentFilters, date: e.target.value })}
                className="w-full bg-[#1A1A1A] text-white border border-gray-800 focus:ring-[#C1FF2F] rounded-md"
              >
                 <option value="">All dates</option>
                 <option value="today">Today</option>
                 <option value="tomorrow">Tomorrow</option>
                 <option value="this-week">This week</option>
                 <option value="next-week">Next week</option>
              </Select>

              <Select
                id="level-mobile"
                value={currentFilters.level}
                onChange={(e) => onFilterChange({ ...currentFilters, level: e.target.value })}
                className="w-full bg-[#1A1A1A] text-white border border-gray-800 focus:ring-[#C1FF2F] rounded-md"
              >
                <option value="">All levels</option>
                {LEVELS.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </Select>
              
              <Select
                id="location-mobile"
                value={currentFilters.location}
                onChange={(e) => onFilterChange({ ...currentFilters, location: e.target.value })}
                className="w-full bg-[#1A1A1A] text-white border border-gray-800 focus:ring-[#C1FF2F] rounded-md"
              >
                 <option value="">All locations</option>
                 {PADEL_LOCATIONS.map((location) => (
                   <option key={location.name} value={location.name}>{location.name}</option>
                 ))}
              </Select>
              
              {/* Joined/All Toggle */}
               <div className="flex items-center h-10">
                 <div className="relative flex items-center border border-gray-800 rounded-full bg-[#1A1A1A] p-1 w-full">
                   <div
                     className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-[#C1FF2F] transition-transform duration-300 ease-in-out ${ 
                       currentFilters.showJoinedOnly ? 'translate-x-full' : 'translate-x-0' 
                     }`}
                     style={{ transform: currentFilters.showJoinedOnly ? 'translateX(calc(100% + 4px))' : 'translateX(0)' }}
                   />
                   <button
                     className={`relative z-10 flex-1 py-1.5 px-3 text-sm font-medium transition-colors duration-300 ease-in-out ${ 
                       !currentFilters.showJoinedOnly ? 'text-black' : 'text-white hover:text-gray-300' 
                     }`}
                     onClick={() => onFilterChange({ ...currentFilters, showJoinedOnly: false })}
                   >
                     All events
                   </button>
                   <button
                     className={`relative z-10 flex-1 py-1.5 px-3 text-sm font-medium transition-colors duration-300 ease-in-out ${ 
                       currentFilters.showJoinedOnly ? 'text-black' : 'text-white hover:text-gray-300' 
                     }`}
                     onClick={() => onFilterChange({ ...currentFilters, showJoinedOnly: true })}
                   >
                     Joined
                   </button>
                 </div>
               </div>

            </div>

            {/* Footer Button - Remove eventCount */}
            <div className="p-4 border-t border-gray-700 mt-auto flex-shrink-0">
              <button 
                onClick={onCloseMobileFilters} 
                className="w-full bg-[#C1FF2F] text-[#161723] py-3 rounded-lg font-semibold text-center"
              >
                Apply Filters
              </button>
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
}; 