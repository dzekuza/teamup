export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export interface Event {
  id: string;
  title: string;
  location: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  price: number;
  maxPlayers: number;
  currentPlayers: number;
  createdBy: string;
  createdAt: Date;
  date: Date;
  time: string;
  players: string[];
} 