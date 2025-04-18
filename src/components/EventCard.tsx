import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Event, Player, MatchResult } from '../types';
import { useAuth } from '../hooks/useAuth';
import { EditEventDialog } from './EditEventDialog';
import { doc, updateDoc, getDoc, arrayUnion, collection, query, where, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
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
import { Bookmark, BookmarkBorder } from '@mui/icons-material';

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

// Add a helper function to extract city from address
const extractCity = (location: string): string => {
  // Try to extract city from location string
  // Common patterns: "Venue Name, City", "Address, City, Country", etc.
  if (!location) return '';
  
  // Split by commas and take the second part if it exists (typically the city)
  const parts = location.split(',');
  if (parts.length >= 2) {
    return parts[1].trim();
  }
  
  // If no comma found or city is not at index 1, 
  // just return the location string as is or truncate it
  return location.length > 20 ? location.substring(0, 20) + '...' : location;
};

// Format the date to display as "Apr 2" format
const formatEventDate = (dateString: string) => {
  const date = new Date(dateString);
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
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
  
  // New state for saved events
  const [isSaved, setIsSaved] = useState(false);
  const [interestedCount, setInterestedCount] = useState(0);
  const [savingEvent, setSavingEvent] = useState(false);

  // Get location image
  const locationData = PADEL_LOCATIONS.find(loc => loc.name === event.location);
  const DEFAULT_COVER_IMAGE = "https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.appspot.com/o/Locations%2Fstatic%20cover.jpg?alt=media&token=4c319254-5854-4b3c-9bc7-e67cfe1a58b1";
  
  const locationImage = event.coverImageURL 
    ? event.coverImageURL
    : event?.sportType === 'Padel' && locationData?.image
      ? locationData.image
      : DEFAULT_COVER_IMAGE;

  const isPastEvent = () => {
    try {
      // Check if event is marked as completed
      if (event.status === 'completed') {
        return true;
      }
      
      // Check if date exists and is a string
      if (!event.date || typeof event.date !== 'string') {
        return false;
      }

      // Check if endTime exists and is a string
      if (!event.endTime || typeof event.endTime !== 'string') {
        return false;
      }
      
      const [year, month, day] = (event.date || '1970-01-01').split('-').map(num => parseInt(num));
      const [hours, minutes] = (event.endTime || '00:00').split(':').map(num => parseInt(num));
      const eventEndDate = new Date(year, month - 1, day, hours, minutes); // month is 0-based
      return eventEndDate < new Date();
    } catch (error) {
      console.error('Error checking if event is past:', error);
      return false;
    }
  };

  // Calculate time left and update event status if needed
  useEffect(() => {
    const calculateTimeLeft = () => {
      try {
        // Parse the date and time strings into a Date object
        const [year, month, day] = (event.date || '1970-01-01').split('-').map(num => parseInt(num));
        const [hours, minutes] = (event.time || '00:00').split(':').map(num => parseInt(num));
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
          
          // Automatically update event status to completed if it's in the past
          if (event.status !== 'completed' && isPastEvent()) {
            const eventRef = doc(db, 'events', event.id);
            updateDoc(eventRef, { status: 'completed' })
              .then(() => {
                console.log('Event automatically marked as completed:', event.id);
                if (onEventUpdated) {
                  onEventUpdated();
                }
              })
              .catch(error => {
                console.error('Error updating event status:', error);
              });
          }
        }
      } catch (error) {
        console.error('Error calculating time left:', error);
        setTimeLeft({ days: 0, hours: 0, minutes: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [event.date, event.time, event.id, event.status, onEventUpdated]);

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

  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!user) return;
      
      try {
        // Check if event is saved by the current user
        const savedDoc = await getDoc(doc(db, 'savedEvents', `${user.uid}_${event.id}`));
        setIsSaved(savedDoc.exists());
        
        // We won't query for total count since it might cause permission issues
        // Just set to 0 or 1 based on current user's status
        setInterestedCount(savedDoc.exists() ? 1 : 0);
      } catch (error) {
        console.error('Error checking saved status:', error);
      }
    };
    
    checkSavedStatus();
  }, [user, event.id]);

  const handleJoinEvent = async () => {
    if (!user || !event) {
      console.error('User or event not available for joining');
      return;
    }

    // Check if the user is already in the event
    if (isJoined) {
      console.log('User already joined this event');
      setError('You have already joined this event');
      return;
    }

    // Check if the event is completed or in the past
    if (isPastEvent() || event.status === 'completed') {
      console.error('Cannot join completed event');
      setError('This event has already completed');
      return;
    }

    console.log('Attempting to join event:', event.id);
    console.log('Current user:', user.uid);
    console.log('Current event players:', event.players);
    console.log('Event max players:', event.maxPlayers);

    if (event.isPrivate) {
      setShowJoinDialog(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const eventRef = doc(db, 'events', event.id);
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) {
        console.error('Event not found');
        setError('Event not found');
        setIsLoading(false);
        return;
      }
      
      const eventData = eventDoc.data() as Event;
      console.log('Event data from DB:', eventData);
      
      const currentPlayers = eventData.players || [];
      console.log('Current players from DB:', currentPlayers);
      
      // Count actual players (non-null entries)
      const actualPlayerCount = currentPlayers.filter(player => player != null).length;
      console.log('Actual player count:', actualPlayerCount);
      
      if (actualPlayerCount >= eventData.maxPlayers) {
        console.error('Event is full');
        setError('Event is full');
        setIsLoading(false);
        return;
      }
      
      const newPlayer: Player = {
        id: user.uid,
        name: user.displayName || 'Unknown Player',
        photoURL: user.photoURL || undefined
      };
      console.log('New player to add:', newPlayer);

      // First try to find an empty slot in the players array
      let updatedPlayers: (Player | null)[] = [...(currentPlayers || [])];
      let foundEmptySlot = false;
      
      if (Array.isArray(updatedPlayers)) {
        for (let i = 0; i < updatedPlayers.length; i++) {
          if (!updatedPlayers[i]) {
            console.log('Found empty slot at index:', i);
            updatedPlayers[i] = newPlayer;
            foundEmptySlot = true;
            break;
          }
        }
        
        // If no empty slots found, and array isn't full yet, add to end
        if (!foundEmptySlot && updatedPlayers.length < eventData.maxPlayers) {
          console.log('No empty slot found, adding to end');
          updatedPlayers.push(newPlayer);
        }
        
        // If array is too short, pad with null values to match maxPlayers
        while (updatedPlayers.length < eventData.maxPlayers) {
          updatedPlayers.push(null);
        }
      } else {
        // If players is not an array or is undefined
        console.log('Players is not an array, creating new array');
        updatedPlayers = Array(eventData.maxPlayers).fill(null);
        updatedPlayers[0] = newPlayer;
      }
      
      console.log('Updated players array:', updatedPlayers);
      
      await updateDoc(eventRef, {
        players: updatedPlayers
      });
      console.log('Successfully updated players in database');
      
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
        console.log('Notification created for event creator');

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
              console.log('Email notification sent to creator');
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
        console.log('Calling onEventUpdated to refresh UI');
        onEventUpdated();
      }
      console.log('Join event process completed successfully');
    } catch (error) {
      console.error('Error joining event:', error);
      setError('Failed to join event');
    } finally {
      setIsLoading(false);
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
    setError(null);
    
    console.log('Attempting to leave event:', event.id);
    console.log('Current user:', user.uid);
    console.log('Current event players:', event.players);

    try {
      const eventRef = doc(db, 'events', event.id);
      
      // Create a new array with the same length as maxPlayers, filled with null values
      const newPlayers: (Player | null)[] = Array(event.maxPlayers).fill(null);
      
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
      
      console.log('Updated players array after leaving:', newPlayers);
      
      await updateDoc(eventRef, {
        players: newPlayers
      });
      console.log('Successfully updated players in database after leaving');
      
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
            console.log('Email notification sent to creator about player leaving');
          }
        } catch (emailError) {
          console.error('Error sending leave notification email:', emailError);
        }
      }
      
      if (onEventUpdated) {
        console.log('Calling onEventUpdated to refresh UI after leaving');
        onEventUpdated();
      }
      console.log('Leave event process completed successfully');
    } catch (error) {
      console.error('Error leaving event:', error);
      setError('Failed to leave event');
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

  const handleSaveEvent = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event propagation to parent elements
    
    if (!user) {
      // Handle not logged in
      navigate('/login');
      return;
    }
    
    setSavingEvent(true);
    
    try {
      const savedEventRef = doc(db, 'savedEvents', `${user.uid}_${event.id}`);
      
      if (isSaved) {
        // Remove from saved events
        await deleteDoc(savedEventRef);
        setIsSaved(false);
        setInterestedCount(0); // Set to 0 since we're not tracking total count anymore
      } else {
        // Add to saved events
        await setDoc(savedEventRef, {
          userId: user.uid,
          eventId: event.id,
          savedAt: new Date().toISOString(),
          eventTitle: event.title,
          eventDate: event.date,
          eventLocation: event.location,
          sportType: event.sportType
        });
        setIsSaved(true);
        setInterestedCount(1); // Set to 1 since we're only tracking current user's status
      }
    } catch (error) {
      console.error('Error saving/unsaving event:', error);
    } finally {
      setSavingEvent(false);
    }
  };

  const renderPlayerSlot = (index: number) => {
    const playerInfo = playerInfos[index];
    const isAvailable = !playerInfo;
    const tooltipContent = playerInfo 
      ? `${playerInfo.name || 'Unknown Player'}${playerInfo.email ? ` (${playerInfo.email})` : ''}`
      : '';
    const isCurrentUser = playerInfo?.id === user?.uid;
    const eventFinished = isPastEvent() || event.status === 'completed';

    if (isAvailable) {
      // For finished events, just show empty slot
      if (eventFinished) {
        return (
          <div className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center opacity-50">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      }
      
      return (
        <button
          onClick={handleJoinEvent}
          disabled={isLoading}
          className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center hover:bg-[#3A3A3A] transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          )}
        </button>
      );
    }

    return (
      <div className="relative group">
        <img
          src={avatars[playerInfo.photoURL as keyof typeof avatars] || avatars.Avatar1}
          alt={playerInfo.name || 'Player'}
          className={`w-10 h-10 rounded-full ${isCurrentUser ? 'border-2 border-[#C1FF2F]' : ''} cursor-pointer hover:opacity-90`}
          onClick={() => setSelectedPlayerId(playerInfo.id)}
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
    <div className="bg-[#1E1E1E] rounded-xl overflow-hidden border border-gray-800 hover:border-[#C1FF2F] transition-all hover:shadow-lg hover:shadow-[#C1FF2F]/20 group">
      {/* Location image and event details section */}
      <div className="relative overflow-hidden" style={{ height: "16rem" }}>
        <img
          src={event.coverImageURL ? event.coverImageURL : (event?.sportType === 'Padel' && locationData?.image ? locationData.image : DEFAULT_COVER_IMAGE)}
          alt={event.title || 'Event image'}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => (e.currentTarget.src = DEFAULT_COVER_IMAGE)}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        
        {/* Event title and date on image */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          {/* Event title and date on image */}
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[#C1FF2F] transition-colors overflow-hidden whitespace-nowrap text-ellipsis">
                {event.title.length > 30 ? event.title.substring(0, 30) + '...' : event.title}
              </h3>
              <div className="flex items-center text-sm text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10A4 4 0 114 10a4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                <span>{extractCity(event.location)}</span>
                
                <span className="mx-2">•</span>
                
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatEventDate(event.date)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Add the save button */}
        <div className="absolute top-2 right-2 z-10">
          <button
          onClick={handleSaveEvent}
            disabled={savingEvent}
            className="bg-black/50 hover:bg-black/70 rounded-full p-1 transition-colors"
        >
          {isSaved ? (
              <Bookmark className="text-[#C1FF2F]" />
            ) : (
              <BookmarkBorder className="text-white" />
            )}
          </button>
        </div>

        {/* Status indicators */}
        <div className="absolute top-2 left-2 right-14 z-10 flex flex-row flex-wrap" style={{ gap: "0.4rem" }}>
          {/* Event status indicator */}
          {isPastEvent() ? (
            <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              Event Finished
            </div>
          ) : timeLeft.days === 0 && timeLeft.hours < 24 ? (
            <div className="bg-[#C1FF2F]/80 text-black px-3 py-1 rounded-full text-sm font-semibold">
              Active Event
            </div>
          ) : null}
          
          {/* Public/Private indicator */}
          <div className={`${event.isPrivate ? 'flex items-center gap-1' : ''} bg-gray-800 text-white px-3 py-1 rounded-full text-sm font-semibold`}>
            {event.isPrivate && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            )}
            {event.isPrivate ? 'Private' : 'Public'}
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={avatars[creatorInfo?.photoURL as keyof typeof avatars] || avatars.Avatar1}
                alt={creatorInfo?.displayName || 'Unknown User'}
                className="w-10 h-10 rounded-full cursor-pointer hover:opacity-90 border-2 border-[#C1FF2F]"
                onClick={() => setSelectedPlayerId(event.createdBy)}
              />
              {creatorInfo?.emailVerified && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                  <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <span className="text-white font-medium block">
                {creatorInfo?.displayName || 'Unknown User'}
              </span>
              <span className="text-xs text-gray-400">Organizer</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Share button */}
            <button
              onClick={() => setIsShareDialogOpen(true)}
              className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-[#2A2A2A] transition-all"
              title="Share event"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            {/* Edit button (only for creator) */}
            {user && event.createdBy === user.uid && (
              <button
                onClick={() => setIsEditDialogOpen(true)}
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-[#2A2A2A] transition-all"
                title="Edit event"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Event Description Section */}
        <div className="mb-4">
          <p className="text-gray-300">{event.description || "No description available."}</p>
        </div>

        {/* Participation Info */}
        <div className="mb-4 text-sm text-gray-400">
          <span>{event.players ? event.players.filter(player => player && player.id).length : 0} Joined</span>
          <span> · {interestedCount} Saved</span>
        </div>

        {/* Time and Level Info in Grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-[#2A2A2A] p-3 rounded-lg hover:bg-[#333333] transition-colors">
            <div className="flex items-center justify-between mb-1">
              <p className="text-gray-400 text-xs">Start time</p>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#C1FF2F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-white font-medium">{event.time}</p>
          </div>
          <div className="bg-[#2A2A2A] p-3 rounded-lg hover:bg-[#333333] transition-colors">
            <div className="flex items-center justify-between mb-1">
              <p className="text-gray-400 text-xs">End time</p>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#C1FF2F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white font-medium">{event.endTime}</p>
          </div>
          <div className="bg-[#2A2A2A] p-3 rounded-lg hover:bg-[#333333] transition-colors">
            <div className="flex items-center justify-between mb-1">
              <p className="text-gray-400 text-xs">Level</p>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#C1FF2F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-white font-medium">{event.level}</p>
          </div>
        </div>

        {/* Join Button */}
            {!isJoined && !isPastEvent() && (
          <button
                onClick={handleJoinEvent}
            disabled={isLoading}
            className="w-full bg-[#C1FF2F] text-black py-3.5 px-4 rounded-xl font-semibold hover:bg-[#B1EF1F] transform hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:shadow-[#C1FF2F]/30"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Join event
              </>
            )}
          </button>
        )}

        {/* Leave game button */}
            {isJoined && !isPastEvent() && (
          <button
                onClick={handleLeaveEvent}
                disabled={isLoading}
            className="mt-3 w-full bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl py-3.5 px-4 font-medium hover:from-red-700 hover:to-red-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm hover:shadow-md hover:shadow-red-900/30 transform hover:translate-y-[-2px]"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Leave Game
              </>
            )}
          </button>
        )}

        {/* Match results button for past events */}
        {isPastEvent() && event.matchResults && Array.isArray(event.matchResults) && event.matchResults.length > 0 && (
          <button
            onClick={() => setIsMatchResultsOpen(true)}
            className="mt-3 w-full bg-blue-600 text-white rounded-xl py-3.5 px-4 font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View Match Results
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
        user={user}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1E1E1E] p-8 rounded-xl max-w-md w-full">
            {error ? (
              <p className="text-red-500 mb-4">{error}</p>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#C1FF2F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Join Private Event
                </h2>
                <form onSubmit={handlePasswordSubmit}>
                  <div className="relative mb-5">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full pl-10 p-3.5 border border-gray-700 bg-[#2A2A2A] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C1FF2F] focus:border-transparent"
                    />
                  </div>
                  {passwordError && (
                    <p className="text-red-500 mb-4 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {passwordError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#C1FF2F] text-black py-3.5 font-medium rounded-xl hover:bg-[#B1EF1F] transform hover:translate-y-[-2px] transition-all shadow-sm hover:shadow-md hover:shadow-[#C1FF2F]/30 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Joining...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Join Event
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
            <button
              onClick={() => setShowJoinDialog(false)}
              className="mt-4 w-full border border-gray-700 text-white py-3.5 rounded-xl font-medium hover:bg-[#2A2A2A] transition-all flex items-center justify-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 