export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  location: string;
  locationName?: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  level: string;
  price: number;
  maxPlayers: number;
  currentPlayers: number;
  players: string[];
  createdAt: string;
  createdBy?: string;
} 