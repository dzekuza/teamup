import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Event, Player, MatchResult } from '../types';
import { useAuth } from '../hooks/useAuth';
import { EditEventDialog } from './EditEventDialog';
import { doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import Avatar1 from '../assets/avatars/Avatar1.png';
import Avatar2 from '../assets/avatars/Avatar2.png';
import Avatar3 from '../assets/avatars/Avatar3.png';
import Avatar4 from '../assets/avatars/Avatar4.png';
import { UserProfileDialog } from './UserProfileDialog';
import { PADEL_LOCATIONS } from '../constants/locations';
import { MatchResultsDialog } from './MatchResultsDialog';
import { sendPlayerJoinedNotification, sendEventUpdate } from '../services/emailService';
import { ShareEventDialog } from './ShareEventDialog';
import { addEventParticipant } from '../services/mailerLiteService';
import { Transition } from '@headlessui/react';
import { createNotification } from '../services/notificationService';
import { sendEventInvitation } from '../services/sendGridService';

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
  name?: string;
  email?: string;
}

interface EventCardProps {
  event: Event;
  onEventUpdated?: () => void;
}

const PlayerTooltip: React.FC<{ children: React.ReactNode; content: string }> = ({ children, content }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <div
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {children}
      </div>
      <Transition
        show={isOpen}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-sm rounded whitespace-nowrap">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      </Transition>
    </div>
  );
};

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
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [creatorInfo, setCreatorInfo] = useState<{
    displayName: string;
    photoURL: string;
    emailVerified: boolean;
  } | null>(null);

  // Get location image
  const locationData = PADEL_LOCATIONS.find(loc => loc.name === event.location);
  const locationImage = event.sportType === 'Padel' 
    ? (locationData?.image || '')
    : 'https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/Locations%2Fstatic%20cover.jpg?alt=media&token=4c319254-5854-4b3c-9bc7-e67cfe1a58b1';

  const isPastEvent = () => {
    try {
      // Check if date exists and is a string
      if (!event.date || typeof event.date !== 'string') {
        return false;
      }

      // Check if endTime exists and is a string
      if (!event.endTime || typeof event.endTime !== 'string') {
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
                const userData = userDoc.data();
                initialInfos[i] = {
                  id: player.id,
                  photoURL: userData?.photoURL || 'Avatar1',
                  name: userData?.displayName || 'Unknown Player',
                  email: userData?.email || undefined
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
      if (event.createdBy) {
        const userDoc = await getDoc(doc(db, 'users', event.createdBy));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCreatorInfo({
            displayName: userData.displayName || 'Unknown User',
            photoURL: userData.photoURL || 'Avatar1',
            emailVerified: userData.emailVerified || false
          });
        }
      }
    };

    fetchPlayerInfos();
    fetchCreatorInfo();
  }, [event.players, event.createdBy]);

  const handleJoinEvent = async () => {
    if (!user || !event) return;

    if (event.isPrivate) {
      setShowJoinDialog(true);
      return;
    }

    try {
      const eventRef = doc(db, 'events', event.id);
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) {
        console.error('Event not found');
        return;
      }

      const eventData = eventDoc.data() as Event;
      const currentPlayers = eventData.players || [];
      
      if (currentPlayers.length >= eventData.maxPlayers) {
        setError('Event is full');
        return;
      }

      const newPlayer: Player = {
        id: user.uid,
        name: user.displayName || 'Unknown Player',
        photoURL: user.photoURL || undefined
      };

      await updateDoc(eventRef, {
        players: arrayUnion(newPlayer)
      });

      try {
        // Create notification for event creator
        await createNotification({
          type: 'event_joined',
          eventId: event.id,
          eventTitle: event.title,
          createdBy: user.uid,
          createdAt: new Date().toISOString(),
          read: false,
          userId: event.createdBy
        });

        // Try to send email notification, but don't block if it fails
        const creatorDoc = await getDoc(doc(db, 'users', event.createdBy));
        if (creatorDoc.exists()) {
          const creatorData = creatorDoc.data();
          if (creatorData.email) {
            try {
              await sendEventInvitation(
                creatorData.email,
                event.title,
                event.date,
                `${event.time} - ${event.endTime}`,
                event.location,
                user.displayName || user.email || 'A new participant'
              );
            } catch (emailError) {
              console.warn('Failed to send email notification:', emailError);
              // Continue execution even if email fails
            }
          }
        }
      } catch (notificationError) {
        console.warn('Failed to create notification:', notificationError);
        // Continue execution even if notification fails
      }

      if (onEventUpdated) {
        onEventUpdated();
      }
    } catch (error) {
      console.error('Error joining event:', error);
      setError('Failed to join event');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (password === event.password) {
      setIsPasswordDialogOpen(false);
      setPassword('');
      await handleJoinEvent();
    } else {
      setPasswordError('Incorrect password');
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

  const renderPlayerSlot = (index: number) => {
    const playerInfo = playerInfos[index];
    const isAvailable = !playerInfo;
    const tooltipContent = playerInfo 
      ? `${playerInfo.name || 'Unknown Player'}${playerInfo.email ? ` (${playerInfo.email})` : ''}`
      : '';
    const isCurrentUser = playerInfo?.id === user?.uid;

    if (isAvailable) {
      return (
        <button
          onClick={handleJoinEvent}
          disabled={isLoading}
          className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center hover:bg-[#3A3A3A] transition-colors"
        >
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      );
    }

    return (
      <div className="relative group">
        <img
          src={avatars[playerInfo.photoURL as keyof typeof avatars] || avatars.Avatar1}
          alt={playerInfo.name || 'Player'}
          className={`w-10 h-10 rounded-full ${isCurrentUser ? 'border-2 border-[#C1FF2F]' : ''}`}
        />
        {tooltipContent && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            {tooltipContent}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#1E1E1E] rounded-xl overflow-hidden border border-gray-800 hover:border-[#C1FF2F] transition-colors">
      {/* Location image and event details section */}
      <div className="relative h-48">
        <img
          src={locationImage}
          alt={event.location}
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        
        {/* Event title and date on image */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white mb-1">{event.title}</h3>
          <p className="text-gray-200">{event.date} at {event.time}</p>
          <p className="text-gray-300 mt-1">{event.location}</p>
        </div>
        
        <div className="absolute top-4 left-4 flex items-center gap-2">
          {/* Players joined indicator */}
          <div className="bg-[#C1FF2F] text-black px-3 py-1 rounded-full text-sm font-medium">
            {event.players?.filter(Boolean).length || 0}/{event.maxPlayers || 4} joined
          </div>
          {/* Event status indicator */}
          {isPastEvent() ? (
            <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              Event Finished
            </div>
          ) : timeLeft.days === 0 && timeLeft.hours < 24 ? (
            <div className="bg-[#C1FF2F] text-black px-3 py-1 rounded-full text-sm font-medium">
              Active Event
            </div>
          ) : null}
          {/* Public/Private indicator */}
          {event.isPrivate ? (
            <div className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Private
            </div>
          ) : (
            <div className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm font-medium">
              Public
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <img
              src={avatars[creatorInfo?.photoURL as keyof typeof avatars] || avatars.Avatar1}
              alt={creatorInfo?.displayName || 'Unknown User'}
              className="w-8 h-8 rounded-full"
            />
            <div className="flex items-center space-x-1">
              <span className="text-white font-medium">
                {creatorInfo?.displayName || 'Unknown User'}
              </span>
              {creatorInfo?.emailVerified && (
                <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Share button */}
            <button
              onClick={() => setIsShareDialogOpen(true)}
              className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-[#2A2A2A] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            {/* Edit button (only for creator) */}
            {user && event.createdBy === user.uid && (
              <button
                onClick={() => setIsEditDialogOpen(true)}
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-[#2A2A2A] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Time info */}
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-[#2A2A2A] rounded-lg px-4 py-3 flex-1">
            <p className="text-sm text-gray-400 mb-1">Time left</p>
            <p className="text-white">
              {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
              {timeLeft.hours}h {timeLeft.minutes}m
            </p>
          </div>
        </div>

        {/* Players */}
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="flex flex-col items-center">
              {renderPlayerSlot(index)}
              {!isPastEvent() && !playerInfos[index] && (
                <span className="mt-2 text-sm text-gray-400">Available</span>
              )}
            </div>
          ))}
        </div>

        {/* Leave game button */}
        {isJoined && !isPastEvent() && (
          <button
            onClick={handleLeaveEvent}
            disabled={isLoading}
            className="mt-6 w-full bg-red-600 text-white rounded-xl p-4 font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Leave Game
          </button>
        )}

        {/* Match results button for past events */}
        {isPastEvent() && event.matchResults && Array.isArray(event.matchResults) && event.matchResults.length > 0 && (
          <button
            onClick={() => setIsMatchResultsOpen(true)}
            className="mt-6 w-full bg-[#2A2A2A] text-white rounded-xl p-4 font-medium hover:bg-[#3A3A3A] transition-colors flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View match results
          </button>
        )}
      </div>

      {/* Dialogs */}
      <EditEventDialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        eventId={event.id}
        onEventUpdated={onEventUpdated || (() => {})}
      />

      <UserProfileDialog
        open={!!selectedPlayerId}
        onClose={() => setSelectedPlayerId(null)}
        userId={selectedPlayerId || ''}
      />

      <MatchResultsDialog
        open={isMatchResultsOpen}
        onClose={() => setIsMatchResultsOpen(false)}
        event={event}
        onSave={handleSaveResults}
      />

      <ShareEventDialog
        open={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        eventId={event.id}
        eventDetails={{
          title: event.title,
          date: event.date,
          time: event.time,
          location: event.location
        }}
      />

      {showJoinDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg">
            {error ? (
              <p className="text-red-500 mb-4">{error}</p>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-4">Join Event</h2>
                <form onSubmit={handlePasswordSubmit}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full p-2 border rounded-md mb-4"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Join Event
                  </button>
                </form>
              </>
            )}
            <button
              onClick={() => setShowJoinDialog(false)}
              className="mt-4 w-full bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 