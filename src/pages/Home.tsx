import React, { useState } from 'react';
import { CreateEventDialog } from '../components/CreateEventDialog';
import { EditEventDialog } from '../components/EditEventDialog';
import { Filters } from '../components/Filters';
import { EventList } from '../components/EventList';

interface FilterOptions {
  date: string;
  level: string;
  location: string;
  showJoinedOnly: boolean;
}

const Home: React.FC = () => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    date: '',
    level: '',
    location: '',
    showJoinedOnly: false
  });

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Events</h1>
      </div>

      <Filters onFilterChange={handleFilterChange} />
      
      <div className="mt-6">
        <EventList filters={filters} />
      </div>

      {isCreateDialogOpen && (
        <CreateEventDialog
          open={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onEventCreated={() => setIsCreateDialogOpen(false)}
        />
      )}

      {selectedEventId && (
        <EditEventDialog
          eventId={selectedEventId}
          open={!!selectedEventId}
          onClose={() => setSelectedEventId(null)}
          onEventUpdated={() => setSelectedEventId(null)}
        />
      )}
    </div>
  );
};

export default Home; 