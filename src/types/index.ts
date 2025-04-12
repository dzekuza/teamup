export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  level: string;
  price: number;
  maxPlayers: number;
  currentPlayers: number;
  players: string[];
  createdAt: string;
} 