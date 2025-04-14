import React, { useState, type FC } from 'react';
import { CreateEventDialog } from '../components/CreateEventDialog';
import { EditEventDialog } from '../components/EditEventDialog';
import { Filters } from '../components/Filters';
import { EventList } from '../components/EventList';
import { FunnelIcon, PlusIcon } from '@heroicons/react/24/outline';

interface FilterOptions {
  date: string;
  level: string;
  location: string;
  showJoinedOnly: boolean;
  searchTerm: string;
  sportType: string;
}

export const Home: FC = () => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    date: '',
    level: '',
    location: '',
    showJoinedOnly: false,
    searchTerm: '',
    sportType: '',
  });

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
  };

  return (
    <div className="min-h-screen bg-[#121212]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with title and mobile filter button */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Events</h1>
          {/* Mobile filter button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center gap-x-2 rounded-md bg-[#1A1A1A] px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#2A2A2A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C1FF2F]"
            onClick={() => setShowMobileFilters(true)}
          >
            <FunnelIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            Filters
          </button>
        </div>

        {/* Desktop filters */}
        <div className="hidden md:block mb-6">
          <Filters
            onFilterChange={handleFilterChange}
            currentFilters={filters}
            showMobileFilters={showMobileFilters}
            onCloseMobileFilters={() => setShowMobileFilters(false)}
          />
        </div>

        {/* Event list */}
        <EventList
          filters={filters}
          onEventClick={handleEventClick}
          onCreateClick={() => setShowCreateDialog(true)}
        />
      </div>

      {/* Mobile filters */}
      <Filters
        onFilterChange={handleFilterChange}
        currentFilters={filters}
        showMobileFilters={showMobileFilters}
        onCloseMobileFilters={() => setShowMobileFilters(false)}
        isMobile
      />

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateEventDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onEventCreated={() => {
            setShowCreateDialog(false);
          }}
        />
      )}

      {showEditDialog && selectedEventId && (
        <EditEventDialog
          open={showEditDialog}
          eventId={selectedEventId}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedEventId(null);
          }}
          onEventUpdated={() => {
            setShowEditDialog(false);
            setSelectedEventId(null);
          }}
        />
      )}
    </div>
  );
};