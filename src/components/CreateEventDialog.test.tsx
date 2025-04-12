import { render, screen } from '@testing-library/react';
import { CreateEventDialog } from './CreateEventDialog';
import { BrowserRouter } from 'react-router-dom';

// Mock useAuth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id' }
  })
}));

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(() => Promise.resolve({ id: 'test-event-id' }))
}));

describe('CreateEventDialog', () => {
  const mockProps = {
    open: true,
    onClose: jest.fn(),
    onEventCreated: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form fields when open', () => {
    render(
      <BrowserRouter>
        <CreateEventDialog {...mockProps} />
      </BrowserRouter>
    );

    // Check if all form elements are present
    expect(screen.getByPlaceholderText('Event title')).toBeInTheDocument();
    expect(screen.getByText('Event location')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Price')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create new event' })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <BrowserRouter>
        <CreateEventDialog {...mockProps} open={false} />
      </BrowserRouter>
    );

    expect(screen.queryByPlaceholderText('Event title')).not.toBeInTheDocument();
  });
}); 