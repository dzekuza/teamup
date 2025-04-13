import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Event } from '../types/index';

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