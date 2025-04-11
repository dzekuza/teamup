import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Event } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { format } from 'date-fns';
import { Users, MapPin, Calendar } from 'lucide-react';

const Home = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsQuery = query(collection(db, 'events'), orderBy('date', 'desc'));
        const querySnapshot = await getDocs(eventsQuery);
        const eventsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date?.toDate() || new Date()
          } as Event;
        });
        setEvents(eventsData);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020304] text-white">
        <div className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020304] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Padel Events</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card 
              key={event.id} 
              className="bg-[#0E1311] border-none hover:bg-[#0E1311]/90 transition-colors cursor-pointer"
              onClick={() => navigate(`/event/${event.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="inline-flex items-center gap-2 px-4 py-1 bg-[#B4D91E] rounded-full text-[#020304] text-sm font-medium">
                  <Users className="h-4 w-4" />
                  {event.currentPlayers}/{event.maxPlayers} joined
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <h2 className="text-2xl font-semibold text-white">
                  {event.title}
                </h2>
                <div className="space-y-2 text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <p>{format(event.date, 'PPP')}, at {format(event.date, 'p')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <p>{event.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home; 