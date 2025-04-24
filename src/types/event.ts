import { Timestamp } from 'firebase/firestore';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string | Timestamp;
  time: string;
  location: {
    name: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  level: string;
  maxPlayers: number;
  currentPlayers: number;
  price: number;
  organizer: {
    id: string;
    name: string;
    photoURL?: string;
  };
  createdAt: string | Timestamp;
  updatedAt: string | Timestamp;
  status: 'active' | 'cancelled' | 'completed';
} 