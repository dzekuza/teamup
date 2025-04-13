import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface MatchResults {
  teamAScore: string;
  teamBScore: string;
  winner: 'Team A' | 'Team B';
}

export const updateEventMatchResults = async (eventId: string, results: MatchResults) => {
  try {
    const eventRef = doc(db, 'events', eventId);
    await updateDoc(eventRef, {
      matchResults: results,
      status: 'completed'
    });
    return true;
  } catch (error) {
    console.error('Error updating match results:', error);
    return false;
  }
}; 