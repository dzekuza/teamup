import { Timestamp } from 'firebase/firestore';
import { Location } from '../constants/locations';

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  phoneNumber: string;
  level: string;
  location: string;
  sports: string[];
  friends: string[];
  friendRequests: string[];
  createdAt: Timestamp;
  emailVerified: boolean;
  bio: string;
  description?: string;
  firstName: string;
  lastName: string;
  isAdmin?: boolean;
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
  status: 'active' | 'completed';
  matchResults?: MatchResult | MatchResult[];
  isPrivate: boolean;
  password?: string;
  sportType: string;
  description?: string;
  customLocationCoordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Player {
  id: string;
  name: string;
  photoURL?: string;
  displayName?: string;
  level?: string;
  uid?: string;
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