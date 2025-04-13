import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Event, Player, MatchResult } from '../types';
import { useAuth } from '../hooks/useAuth';
import { EditEventDialog } from './EditEventDialog';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Avatar1 from '../assets/avatars/Avatar1.png';
import Avatar2 from '../assets/avatars/Avatar2.png';
import Avatar3 from '../assets/avatars/Avatar3.png';
import Avatar4 from '../assets/avatars/Avatar4.png';
import { UserProfileDialog } from './UserProfileDialog';
import { PADEL_LOCATIONS } from '../constants/locations';
import { MatchResultsDialog } from './MatchResultsDialog';
import { sendPlayerJoinedNotification, sendEventUpdate } from '../utils/emailService';

const avatars = {
  Avatar1,
  Avatar2,
  Avatar3,
  Avatar4,
};

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
}

interface PlayerInfo {
  id: string;
  photoURL: string;
}

interface EventCardProps {
  event: Event;
  onEventUpdated?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onEventUpdated }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isJoined = user && event.players && event.players.some(player => player && player.id === user.uid);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playerInfos, setPlayerInfos] = useState<(PlayerInfo | null)[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [creatorEmail, setCreatorEmail] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0 });
  const [isMatchResultsOpen, setIsMatchResultsOpen] = useState(false);

  // Get location image
  const locationData = PADEL_LOCATIONS.find(loc => loc.name === event.location);
  const locationImage = locationData?.image || '';

  const isPastEvent = () => {
    try {
      if (!event.date || !event.endTime) {
        return false;
      }
      
      const [year, month, day] = event.date.split('-').map(num => parseInt(num));
      const [hours, minutes] = event.endTime.split(':').map(num => parseInt(num));
      const eventEndDate = new Date(year, month - 1, day, hours, minutes); // month is 0-based
      return eventEndDate < new Date();
    } catch (error) {
      console.error('Error checking if event is past:', error);
      return false;
    }
  };

  // Calculate time left
  useEffect(() => {
    const calculateTimeLeft = () => {
      try {
        // Parse the date and time strings into a Date object
        const [year, month, day] = event.date.split('-').map(num => parseInt(num));
        const [hours, minutes] = event.time.split(':').map(num => parseInt(num));
        const eventDate = new Date(year, month - 1, day, hours, minutes); // month is 0-based
        const now = new Date();
        const difference = eventDate.getTime() - now.getTime();

        if (difference > 0) {
          const days = Math.floor(difference / (1000 * 60 * 60 * 24));
          const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

          setTimeLeft({ days, hours, minutes });
        } else {
          // Event has passed
          setTimeLeft({ days: 0, hours: 0, minutes: 0 });
        }
      } catch (error) {
        console.error('Error calculating time left:', error);
        setTimeLeft({ days: 0, hours: 0, minutes: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [event.date, event.time]);

  useEffect(() => {
    const fetchPlayerInfos = async () => {
      try {
        if (!event.players || !Array.isArray(event.players)) {
          setPlayerInfos([null, null, null, null]);
          return;
        }

        // Initialize array with nulls
        const initialInfos: (PlayerInfo | null)[] = Array(4).fill(null);
        
        // Process only valid players
        for (let i = 0; i < event.players.length && i < 4; i++) {
          const player = event.players[i];
          if (player && player.id) {
            try {
              const userDoc = await getDoc(doc(db, 'users', player.id));
              if (userDoc.exists()) {
                initialInfos[i] = {
                  id: player.id,
                  photoURL: userDoc.data()?.photoURL || 'Avatar1'
                };
              }
            } catch (error) {
              console.error(`Error fetching player info for ID ${player.id}:`, error);
            }
          }
        }
        
        setPlayerInfos(initialInfos);
      } catch (error) {
        console.error('Error fetching player infos:', error);
        setPlayerInfos([null, null, null, null]);
      }
    };

    const fetchCreatorInfo = async () => {
      try {
        if (!event.createdBy) {
          setCreatorEmail('');
          return;
        }
        const creatorDoc = await getDoc(doc(db, 'users', event.createdBy));
        if (!creatorDoc.exists()) {
          console.warn(`Creator document not found for ID: ${event.createdBy}`);
          setCreatorEmail('');
          return;
        }
        setCreatorEmail(creatorDoc.data().email || '');
      } catch (error) {
        console.error('Error fetching creator info:', error);
        setCreatorEmail('');
      }
    };

    fetchPlayerInfos();
    fetchCreatorInfo();
  }, [event.players, event.createdBy]);

  const handleJoinEvent = async (position: number) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      const eventRef = doc(db, 'events', event.id);
      
      // Create new player object
      const newPlayer: Player = {
        id: user.uid,
        name: user.displayName || user.email || 'Unknown Player',
        photoURL: user.photoURL || undefined
      };
      
      // Get current players and add the new player
      const currentPlayers = Array.isArray(event.players) ? [...event.players] : [];
      
      // Check if player is already in the event
      if (currentPlayers.some(player => player && player.id === user.uid)) {
        console.log('Player already in event');
        setIsLoading(false);
        return;
      }
      
      // Add the new player
      currentPlayers.push(newPlayer);
      
      await updateDoc(eventRef, {
        players: currentPlayers
      });
      
      // Send email notification to event creator
      if (event.createdBy && event.createdBy !== user.uid) {
        try {
          const creatorDoc = await getDoc(doc(db, 'users', event.createdBy));
          if (creatorDoc.exists() && creatorDoc.data().email) {
            await sendPlayerJoinedNotification(
              creatorDoc.data().email,
              event.title,
              newPlayer.name
            );
          }
        } catch (emailError) {
          console.error('Error sending join notification email:', emailError);
        }
      }
      
      if (onEventUpdated) {
        onEventUpdated();
      }
    } catch (error) {
      console.error('Error joining event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveEvent = async () => {
    if (!user || isLoading) return;
    setIsLoading(true);

    try {
      const eventRef = doc(db, 'events', event.id);
      
      // Create a new array with the same length as maxPlayers, filled with null values
      const newPlayers = Array(event.maxPlayers).fill(null);
      
      // Filter out the current user and copy remaining players to their positions
      let position = 0;
      if (event.players && Array.isArray(event.players)) {
        event.players.forEach(player => {
          if (player && player.id !== user.uid && position < newPlayers.length) {
            newPlayers[position] = player;
            position++;
          }
        });
      }
      
      await updateDoc(eventRef, {
        players: newPlayers
      });
      
      // Send email notification to event creator
      if (event.createdBy && event.createdBy !== user.uid) {
        try {
          const creatorDoc = await getDoc(doc(db, 'users', event.createdBy));
          if (creatorDoc.exists() && creatorDoc.data().email) {
            await sendEventUpdate(
              creatorDoc.data().email,
              event.title,
              `${user.displayName || user.email || 'A player'} has left the event.`
            );
          }
        } catch (emailError) {
          console.error('Error sending leave notification email:', emailError);
        }
      }
      
      if (onEventUpdated) {
        onEventUpdated();
      }
    } catch (error) {
      console.error('Error leaving event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveResults = async (results: MatchResult[]) => {
    if (!user) return;
    
    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        matchResults: results,
        status: 'completed'  // Update status when results are added
      });
      
      setIsMatchResultsOpen(false);
      if (onEventUpdated) {
        onEventUpdated();
      }
    } catch (error) {
      console.error('Error saving match results:', error);
    }
  };

  return (
    <div className="bg-[#1E1E1E] rounded-3xl overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="relative">
        <img
          src={locationImage}
          alt={event.location}
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent">
          {/* Event Title and Details */}
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-2xl font-bold text-white mb-2">{event.title}</h2>
            <p className="text-gray-300 text-sm">
              {event.location} · {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {event.time} - {event.endTime}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Countdown Timer */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[#2A2A2A] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{timeLeft.days}</div>
            <div className="text-sm text-gray-400">Days</div>
          </div>
          <div className="bg-[#2A2A2A] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{timeLeft.hours}</div>
            <div className="text-sm text-gray-400">Hours</div>
          </div>
          <div className="bg-[#2A2A2A] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{timeLeft.minutes}</div>
            <div className="text-sm text-gray-400">Minutes</div>
          </div>
        </div>

        <p className="text-gray-500 text-sm mb-4">
          Created by: {creatorEmail}
        </p>

        {/* Player Slots */}
        <div className="flex items-center justify-between gap-4 mb-6">
          {/* First Team */}
          <div className="flex gap-4">
            {[0, 1].map((index) => {
              const player = event.players[index];
              const isAvailable = !player && !isLoading && !isJoined && event.players.length < event.maxPlayers;
              
              return (
                <div key={index} className="text-center">
                  <button 
                    onClick={() => {
                      if (player?.id) {
                        setSelectedPlayerId(player.id);
                      } else if (isAvailable && user) {
                        handleJoinEvent(index);
                      } else if (player && player.id === user?.uid) {
                        handleLeaveEvent();
                      } else if (!user) {
                        navigate('/login');
                      }
                    }}
                    disabled={!isAvailable && (!player || player.id !== user?.uid)}
                    className={`w-12 h-12 rounded-full overflow-hidden relative group transition-all duration-200
                      ${player ? 'border-2 border-[#2A2A2A] hover:border-[#C1FF2F] cursor-pointer' : 
                        isAvailable ? 'border-2 border-dashed border-[#C1FF2F] hover:border-solid hover:bg-[#C1FF2F]/10' : 
                        'border-2 border-dashed border-gray-600'}`}
                  >
                    {player ? (
                      <>
                        <div className="w-full h-full bg-[#2A2A2A] flex items-center justify-center">
                          {playerInfos[index]?.photoURL ? (
                            <img 
                              src={avatars[playerInfos[index]?.photoURL as keyof typeof avatars] || avatars.Avatar1} 
                              alt={player.name || 'Player'} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-sm">{player.name ? player.name.charAt(0) : '?'}</span>
                          )}
                        </div>
                        {player.id === user?.uid && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[#C1FF2F] group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    )}
                  </button>
                  <div className="mt-2 text-gray-400 text-sm">
                    {player ? (player.name || 'Unknown Player') : 'Available'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* VS Divider */}
          <div className="text-[#C1FF2F] font-medium">VS</div>

          {/* Second Team */}
          <div className="flex gap-4">
            {[2, 3].map((index) => {
              const player = event.players[index];
              const isAvailable = !player && !isLoading && !isJoined && event.players.length < event.maxPlayers;
              
              return (
                <div key={index} className="text-center">
                  <button 
                    onClick={() => {
                      if (player?.id) {
                        setSelectedPlayerId(player.id);
                      } else if (isAvailable && user) {
                        handleJoinEvent(index);
                      } else if (player && player.id === user?.uid) {
                        handleLeaveEvent();
                      } else if (!user) {
                        navigate('/login');
                      }
                    }}
                    disabled={!isAvailable && (!player || player.id !== user?.uid)}
                    className={`w-12 h-12 rounded-full overflow-hidden relative group transition-all duration-200
                      ${player ? 'border-2 border-[#2A2A2A] hover:border-[#C1FF2F] cursor-pointer' : 
                        isAvailable ? 'border-2 border-dashed border-[#C1FF2F] hover:border-solid hover:bg-[#C1FF2F]/10' : 
                        'border-2 border-dashed border-gray-600'}`}
                  >
                    {player ? (
                      <>
                        <div className="w-full h-full bg-[#2A2A2A] flex items-center justify-center">
                          {playerInfos[index]?.photoURL ? (
                            <img 
                              src={avatars[playerInfos[index]?.photoURL as keyof typeof avatars] || avatars.Avatar1} 
                              alt={player.name || 'Player'} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-sm">{player.name ? player.name.charAt(0) : '?'}</span>
                          )}
                        </div>
                        {player.id === user?.uid && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[#C1FF2F] group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    )}
                  </button>
                  <div className="mt-2 text-gray-400 text-sm">
                    {player ? (player.name || 'Unknown Player') : 'Available'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Match Results Button - Show for all events with results */}
        {event.matchResults && (
          <button
            onClick={() => setIsMatchResultsOpen(true)}
            className="w-full mt-4 px-4 py-2 bg-[#2A2A2A] text-white font-medium rounded-xl hover:bg-[#3A3A3A] transition-colors flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View Match Statistics
          </button>
        )}

        {/* Add Results Button - Only show for past events and event creator */}
        {!event.matchResults && isPastEvent() && user?.uid === event.createdBy && (
          <button
            onClick={() => setIsMatchResultsOpen(true)}
            className="w-full mt-4 px-4 py-2 bg-[#C1FF2F] text-black font-medium rounded-xl hover:bg-[#B1EF1F] transition-colors"
          >
            Add Match Results
          </button>
        )}

        {/* Edit Button - Only show if event is not completed */}
        {user?.uid === event.createdBy && !event.matchResults && (
          <button
            onClick={() => setIsEditDialogOpen(true)}
            className="w-full text-center text-[#C1FF2F] hover:underline mt-4"
          >
            Edit event
          </button>
        )}

        {/* Leave Event Button - Only show if user has joined and is not the creator */}
        {isJoined && user?.uid !== event.createdBy && !isPastEvent() && (
          <button
            onClick={handleLeaveEvent}
            disabled={isLoading}
            className="w-full mt-4 px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
          >
            {isLoading ? 'Leaving...' : 'Leave Event'}
          </button>
        )}
      </div>

      <EditEventDialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onEventUpdated={onEventUpdated || (() => {})}
        eventId={event.id}
      />

      <UserProfileDialog
        open={!!selectedPlayerId}
        onClose={() => setSelectedPlayerId(null)}
        userId={selectedPlayerId || ''}
      />

      <MatchResultsDialog
        event={event}
        open={isMatchResultsOpen}
        onClose={() => setIsMatchResultsOpen(false)}
        onSave={handleSaveResults}
      />
    </div>
  );
}; 