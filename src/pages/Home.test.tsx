import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Home } from './Home';
import { Event } from '../types';

// Mock useAuth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signOut: jest.fn(),
  })
}));

// Mock useEvents hook
jest.mock('../hooks/useEvents', () => ({
  useEvents: () => ({
    events: [],
    loading: false,
    error: null,
  })
}));

// Mock EventCard component
jest.mock('../components/EventCard', () => ({
  EventCard: ({ event }: { event: Event }) => <div data-testid="event-card">{event.title}</div>
}));

// Mock CreateEventDialog component
jest.mock('../components/CreateEventDialog', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => 
    isOpen ? <div data-testid="create-dialog">Create Event Dialog</div> : null
}));

describe('Home', () => {
  it('renders without crashing', () => {
    render(<Home />);
    expect(screen.getByText('Padel Events')).toBeInTheDocument();
  });

  it('shows login message when user is not authenticated', () => {
    render(<Home />);
    expect(screen.getByText('Please log in to create events and join games.')).toBeInTheDocument();
  });

  it('shows no events message when there are no events', () => {
    render(<Home />);
    expect(screen.getByText('No events found. Be the first to create one!')).toBeInTheDocument();
  });
}); 