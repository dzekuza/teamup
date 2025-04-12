import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock useAuth hook
jest.mock('./hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signOut: jest.fn(),
  })
}));

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText(/WebPadel/i)).toBeInTheDocument();
  });
});
