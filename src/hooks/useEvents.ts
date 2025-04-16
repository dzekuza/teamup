import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Event, MatchResult } from '../types/index';

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsRef = collection(db, 'events');
        const q = query(eventsRef, orderBy('date', 'asc'));
        const querySnapshot = await getDocs(q);
        
        const fetchedEvents = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Convert Firestore Timestamp to ISO string if it exists
            date: data.date instanceof Timestamp ? data.date.toDate().toISOString().split('T')[0] : data.date,
          };
        }) as Event[];
        
        setEvents(fetchedEvents);
        setError(null);
      } catch (err) {
        setError('Failed to fetch events');
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return { events, loading, error };
};

export const useUpdateMatchResult = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateMatchResult = async (eventId: string, results: MatchResult[]) => {
    setLoading(true);
    setError(null);
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        matchResults: results,
        status: 'completed'
      });
      return true;
    } catch (err) {
      console.error('Error updating match results:', err);
      setError('Failed to update match results');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { updateMatchResult, loading, error };
}; 