export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export interface MatchResult {
  teamAScore: string;
  teamBScore: string;
  winner: 'Team A' | 'Team B';
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime: string;
  location: string;
  level: string;
  players: Player[];
  maxPlayers: number;
  createdBy: string;
  price: number;
  status: 'open' | 'closed' | 'completed';
  matchResults?: MatchResult | MatchResult[];
}

export interface Player {
  id: string;
  name: string;
  photoURL?: string;
}

export interface Notification {
  id: string;
  type: 'new_event' | 'event_joined' | 'event_cancelled';
  eventId: string;
  eventTitle: string;
  createdBy: string;
  createdAt: string;
  read: boolean;
  userId: string;
} 