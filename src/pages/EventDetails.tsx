import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { Event, User } from '../types';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Edit, Share } from 'lucide-react';
import PlayerAvatars from '../components/PlayerAvatars';

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [players, setPlayers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      try {
        const eventDoc = await getDoc(doc(db, 'events', id));
        if (eventDoc.exists()) {
          const eventData = { id: eventDoc.id, ...eventDoc.data() } as Event;
          setEvent(eventData);
          
          // Fetch player details
          const playerPromises = eventData.players.map(async (playerId) => {
            const userDoc = await getDoc(doc(db, 'users', playerId));
            if (userDoc.exists()) {
              return { id: userDoc.id, ...userDoc.data() } as User;
            }
            return null;
          });

          const playersData = (await Promise.all(playerPromises)).filter((player): player is User => player !== null);
          setPlayers(playersData);
        }
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleJoinEvent = async () => {
    if (!event || !user) return;

    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        players: arrayUnion(user.uid),
        currentPlayers: event.currentPlayers + 1
      });
      setEvent({
        ...event,
        players: [...event.players, user.uid],
        currentPlayers: event.currentPlayers + 1
      });
    } catch (error) {
      console.error('Error joining event:', error);
    }
  };

  const handleLeaveEvent = async () => {
    if (!event || !user) return;

    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        players: arrayRemove(user.uid),
        currentPlayers: event.currentPlayers - 1
      });
      setEvent({
        ...event,
        players: event.players.filter(playerId => playerId !== user.uid),
        currentPlayers: event.currentPlayers - 1
      });
    } catch (error) {
      console.error('Error leaving event:', error);
    }
  };

  const handleShare = () => {
    if (!event) return;
    const eventUrl = `${window.location.origin}/event/${event.id}`;
    navigator.clipboard.writeText(eventUrl);
    // You could add a toast notification here to show that the URL was copied
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Event not found</p>
      </div>
    );
  }

  const isJoined = user ? event.players.includes(user.uid) : false;
  const canJoin = user && !isJoined && event.currentPlayers < event.maxPlayers;
  const isCreator = user && user.uid === event.createdBy;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle>{event.title}</CardTitle>
            {isCreator && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/event/${event.id}/edit`)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                >
                  <Share className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Location</h4>
              <p className="text-muted-foreground">{event.location}</p>
            </div>
            <div>
              <h4 className="font-medium">Level</h4>
              <p className="text-muted-foreground">{event.level}</p>
            </div>
            <div>
              <h4 className="font-medium">Price</h4>
              <p className="text-muted-foreground">${event.price}</p>
            </div>
            <div>
              <h4 className="font-medium">Players</h4>
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground">{event.currentPlayers} / {event.maxPlayers}</p>
                <PlayerAvatars playerIds={event.players} maxDisplay={4} />
              </div>
              <div className="mt-2 space-y-2">
                {players.map((player) => (
                  <div key={player.id} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      {player.displayName?.[0] || player.email?.[0] || '?'}
                    </div>
                    <span className="text-sm">{player.displayName || player.email}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {user ? (
            isJoined ? (
              <Button variant="destructive" onClick={handleLeaveEvent}>
                Leave Event
              </Button>
            ) : canJoin ? (
              <Button onClick={handleJoinEvent}>
                Join Event
              </Button>
            ) : (
              <Button disabled>
                Event Full
              </Button>
            )
          ) : (
            <Button onClick={() => navigate('/login')}>
              Login to Join
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate('/')}>
            Back to Events
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EventDetails; 