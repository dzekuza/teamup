import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, Timestamp, deleteDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { Event, Player, User } from '../types';
import { UserProfileDialog } from '../components/UserProfileDialog';
import Avatar1 from '../assets/avatars/Avatar1.png';
import Avatar2 from '../assets/avatars/Avatar2.png';
import Avatar3 from '../assets/avatars/Avatar3.png';
import Avatar4 from '../assets/avatars/Avatar4.png';
import { PADEL_LOCATIONS, Location } from '../constants/locations';
import 'mapbox-gl/dist/mapbox-gl.css';
import Map, { Marker } from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft as ArrowLeftIcon, 
  Share as ShareIcon, 
  Edit as EditIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  CameraAlt as CameraIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { ShareMemoryDialog } from '../components/ShareMemoryDialog';
import { EditEventDialog } from '../components/EditEventDialog';
import { ShareEventDialog } from '../components/ShareEventDialog';
import { EventStickyBar } from '../components/EventStickyBar';
// Don't use React Icons for now - using SVG directly
// import { FaShareAlt } from 'react-icons/fa/index.js';
// import { FaEdit } from 'react-icons/fa/index.js';

const avatars = {
  Avatar1,
  Avatar2,
  Avatar3,
  Avatar4,
};

// Default Mostai location coordinates for fallback
const DEFAULT_COORDINATES = {
  lat: 54.6872,
  lng: 25.2797
};

// Fallback cover image
const DEFAULT_COVER_IMAGE = "https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/Locations%2Fstatic%20cover.jpg?alt=media&token=4c319254-5854-4b3c-9bc7-e67cfe1a58b1";

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}

// Helper function to format date for display
const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Helper function to calculate end time
const calculateEndTime = (startTime: string): string => {
  // Parse the start time (assuming format like "16:00")
  const [hours, minutes] = startTime.split(':').map(Number);
  
  // Add 1.5 hours (90 minutes) for the typical duration of a padel game
  let endHours = hours + 1;
  let endMinutes = minutes + 30;
  
  // Handle overflow minutes
  if (endMinutes >= 60) {
    endHours += 1;
    endMinutes -= 60;
  }
  
  // Format with leading zeros if needed
  const formattedEndHours = endHours % 24;
  const formattedEndMinutes = endMinutes.toString().padStart(2, '0');
  
  return `${formattedEndHours}:${formattedEndMinutes}`;
};

// Player data types helper
const isPlayerObject = (player: any): player is Player => {
  return player !== null && typeof player === 'object' && 'id' in player;
};

const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [creatorInfo, setCreatorInfo] = useState<{
    displayName: string;
    photoURL: string;
  } | null>(null);
  const [fallbackImage, setFallbackImage] = useState(false);
  const [locationData, setLocationData] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [isPlayerInEvent, setIsPlayerInEvent] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);
  const [interestedCount, setInterestedCount] = useState(0);
  const [shareMemoryDialogOpen, setShareMemoryDialogOpen] = useState(false);
  // Hide navigation on mobile screens when viewing event details
  const [hideNavigation, setHideNavigation] = useState(true);
  // Check if user is admin or creator of the event
  const isUserCreator = user?.uid === event?.createdBy;
  
  // Map view state
  const [viewState, setViewState] = useState<ViewState>({
    longitude: DEFAULT_COORDINATES.lng,
    latitude: DEFAULT_COORDINATES.lat,
    zoom: 14
  });
  
  // Update view state when location data changes
  useEffect(() => {
    if (locationData?.coordinates) {
      setViewState({
        longitude: locationData.coordinates.lng,
        latitude: locationData.coordinates.lat,
        zoom: 14
      });
    }
  }, [locationData]);

  // Send message to hide navigation on mobile
  useEffect(() => {
    // Using a custom event to communicate with the navigation components
    window.dispatchEvent(new CustomEvent('toggleNavigation', { detail: { hide: hideNavigation } }));

    return () => {
      // On component unmount, show navigation again
      window.dispatchEvent(new CustomEvent('toggleNavigation', { detail: { hide: false } }));
    };
  }, [hideNavigation]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        if (!id) {
          setError('No event ID provided');
          return;
        }
        const eventDoc = await getDoc(doc(db, 'events', id));
        if (eventDoc.exists()) {
          const eventData = eventDoc.data() as Event;
          
          // Ensure players array is clean by filtering out null/undefined
          const cleanPlayers = eventData.players?.filter(Boolean) || [];
          
          // Set the event with processed players array
          setEvent({ 
            ...eventData, 
            id: eventDoc.id,
            players: cleanPlayers
          });
          
          // Check if user is in the event
          if (user && cleanPlayers.length > 0) {
            const isPlayerInEvent = cleanPlayers.some(p => 
              isPlayerObject(p) ? p.id === user.uid : p === user.uid
            );
            setIsPlayerInEvent(isPlayerInEvent);
          }
          
          // For Padel events, use predefined locations, for other events use custom coordinates
          if (eventData.sportType === 'Padel') {
            const locationObj = PADEL_LOCATIONS.find(loc => loc.name === eventData.location);
            setLocationData(locationObj || null);
          } else if (eventData.customLocationCoordinates) {
            // For non-Padel events with custom coordinates, create a location object
            setLocationData({
              name: eventData.location,
              address: eventData.location,
              coordinates: eventData.customLocationCoordinates,
              image: DEFAULT_COVER_IMAGE
            });
          } else {
            // Fallback to default coordinates if no custom coordinates
            setLocationData({
              name: eventData.location,
              address: eventData.location,
              coordinates: DEFAULT_COORDINATES,
              image: DEFAULT_COVER_IMAGE
            });
          }
          
          // Log to debug
          console.log("Location data:", locationData);
          console.log("Event data:", eventData);
          
          // Extract and set players
          if (eventData.players && Array.isArray(eventData.players)) {
            setPlayers(cleanPlayers);
          }

          // Fetch creator info
          if (eventData.createdBy) {
            const creatorDoc = await getDoc(doc(db, 'users', eventData.createdBy));
            if (creatorDoc.exists()) {
              const creatorData = creatorDoc.data();
              setCreatorInfo({
                displayName: creatorData.displayName || 'Unknown User',
                photoURL: creatorData.photoURL || 'Avatar1',
              });
            }
          }
        } else {
          setError('Event not found');
        }
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Failed to load event');
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id, user]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setCurrentUser(userDoc.data() as User);
        }
      }
    };
    
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!user || !event) return;
      
      try {
        // Check if event is saved by the current user
        const savedDoc = await getDoc(doc(db, 'savedEvents', `${user.uid}_${event.id}`));
        setIsSaved(savedDoc.exists());
        
        // Set interested count based on current user's status only
        setInterestedCount(savedDoc.exists() ? 1 : 0);
      } catch (error) {
        console.error('Error checking saved status:', error);
      }
    };
    
    checkSavedStatus();
  }, [user, event]);

  const handleJoinEvent = async () => {
    if (!user || !event) return;
    
    // Check if the user is already in the event
    const isAlreadyJoined = event.players.filter(Boolean).some(player => 
      isPlayerObject(player) ? player.id === user.uid : player === user.uid
    );
    
    if (isAlreadyJoined) {
      toast.error('You have already joined this event');
      return;
    }

    try {
      setActionInProgress(true);
      const eventRef = doc(db, 'events', event.id);
      const newPlayer: Player = {
        id: user.uid,
        name: user.displayName || user.email || 'Unknown Player',
        photoURL: user.photoURL || undefined
      };

      // Get the latest event data
      const eventDoc = await getDoc(eventRef);
      if (!eventDoc.exists()) {
        toast.error('Event not found');
        return;
      }

      const currentEvent = eventDoc.data() as Event;
      const currentPlayers = currentEvent.players?.filter(Boolean) || [];
      
      // Check if we've reached the maximum players
      if (currentPlayers.length >= event.maxPlayers) {
        toast.error('This event is now full');
        return;
      }

      // Update in database
      await updateDoc(eventRef, {
        players: arrayUnion(newPlayer)
      });

      // Update local state with accurate player list
      const updatedPlayers = [...event.players.filter(Boolean), newPlayer];
      setEvent({
        ...event,
        players: updatedPlayers
      });
      
      setPlayers(updatedPlayers);
      setIsPlayerInEvent(true);
      toast.success('Successfully joined the event!');
    } catch (error) {
      console.error('Error joining event:', error);
      toast.error('Failed to join event');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setIsProfileOpen(true);
  };

  // Player profile handler
  const handleViewProfile = (uid: string) => {
    setSelectedUserId(uid);
    setIsProfileOpen(true);
  };

  const handleLeaveEvent = async () => {
    if (!event || !user) return;
    
    try {
      setActionInProgress(true);
      const eventRef = doc(db, 'events', id || '');
      const currentPlayer = event.players.find(p => 
        isPlayerObject(p) ? p.id === user.uid : p === user.uid
      );
      
      if (!currentPlayer) {
        toast.error('You are not in this event');
        return;
      }

      // Remove the player from the event
      await updateDoc(eventRef, {
        players: arrayRemove(currentPlayer)
      });

      // Update local state with filtered player list
      const updatedPlayers = event.players.filter(p => 
        isPlayerObject(p) ? p.id !== user.uid : p !== user.uid
      );
      
      setEvent({
        ...event,
        players: updatedPlayers
      });
      
      setPlayers(updatedPlayers);
      setIsPlayerInEvent(false);
      
      toast.success('Left the event successfully');
      navigate('/');
    } catch (error) {
      console.error('Error leaving event:', error);
      toast.error('Failed to leave the event');
    } finally {
      setActionInProgress(false);
    }
  };

  // Make sure handleShareEvent is defined
  const handleShareEvent = () => {
    setShareDialogOpen(true);
  };

  // Make sure handleEditEvent is defined
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };

  // Add handle delete event function
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const handleDeleteEvent = async () => {
    if (!event || !user) return;
    
    try {
      setActionInProgress(true);
      const eventRef = doc(db, 'events', event.id);
      
      // Check if user is creator or admin
      if (event.createdBy !== user.uid && !(currentUser?.isAdmin)) {
        toast.error('You do not have permission to delete this event');
        return;
      }
      
      // Delete the event document
      await deleteDoc(eventRef);
      
      // Also delete any saved references to this event
      const savedEventsQuery = query(
        collection(db, 'savedEvents'), 
        where('eventId', '==', event.id)
      );
      
      const savedEventsDocs = await getDocs(savedEventsQuery);
      const deletePromises = savedEventsDocs.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      toast.success('Event deleted successfully');
      navigate('/');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    } finally {
      setActionInProgress(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSaveEvent = async () => {
    if (!user || !event) return;
    
    setSavingEvent(true);
    
    try {
      const savedEventRef = doc(db, 'savedEvents', `${user.uid}_${event.id}`);
      
      if (isSaved) {
        // Remove from saved events
        await deleteDoc(savedEventRef);
        setIsSaved(false);
        setInterestedCount(0); // Set to 0 since we're only tracking current user's status
        toast.success('Event removed from saved');
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
        toast.success('Event saved');
      }
    } catch (error) {
      console.error('Error saving/unsaving event:', error);
      toast.error('Failed to save event');
    } finally {
      setSavingEvent(false);
    }
  };

  // Add a new function to handle opening the share memory dialog
  const handleShareMemory = () => {
    setShareMemoryDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#161723]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#C1FF2F]"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#161723]">
        <p className="text-center text-gray-500">Event not found</p>
      </div>
    );
  }

  const isJoined = user ? event.players.filter(Boolean).some(player => 
    isPlayerObject(player) ? player.id === user.uid : player === user.uid
  ) : false;
  const canJoin = user && !isJoined && event.players.length < event.maxPlayers && event.status !== 'completed';
  
  // Use locationData coordinates or fallback to default
  const coordinates = locationData?.coordinates || DEFAULT_COORDINATES;
  
  // Determine which cover image to use
  const coverImageUrl = event.coverImageURL 
    ? event.coverImageURL
    : event?.sportType === 'Padel' && locationData?.image
      ? locationData.image
      : DEFAULT_COVER_IMAGE;

  // Show players section
  const renderPlayers = () => {
    if (!event) return null;
    
    return (
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-4 text-white">Players ({event.players.filter(player => player && player.id).length}/{event.maxPlayers})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {event.players.filter(player => player && player.id).map((player, index) => {
            // Determine if player is an object or string
            const playerId = isPlayerObject(player) ? player.id : player;
            const playerName = isPlayerObject(player) ? (player.displayName || player.name) : 'Unknown';
            const playerPhotoSrc = isPlayerObject(player) && player.photoURL;
            const playerLevel = isPlayerObject(player) ? player.level : null;
            
            // Handle avatar sources properly
            let avatarSrc = '/images/default-avatar.png';
            if (playerPhotoSrc) {
              // Check if it's a reference to one of our imported avatars
              if (playerPhotoSrc === 'Avatar1' || playerPhotoSrc === 'Avatar2' || 
                  playerPhotoSrc === 'Avatar3' || playerPhotoSrc === 'Avatar4') {
                avatarSrc = avatars[playerPhotoSrc as keyof typeof avatars];
              } else {
                avatarSrc = playerPhotoSrc;
              }
            }
            
            return (
              <div 
                key={`player-${index}-${playerId || 'unknown'}`} 
                className="flex items-center space-x-2 my-2 p-3 bg-[rgb(35_35_35/var(--tw-bg-opacity))] rounded-lg hover:bg-[rgb(40_40_40/var(--tw-bg-opacity))] cursor-pointer"
                onClick={() => handleViewProfile(playerId)}
              >
                <img 
                  src={avatarSrc}
                  alt={`Player ${index + 1}`} 
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/images/default-avatar.png' }}
                />
                <div>
                  <p className="font-medium text-white">{playerName}</p>
                  {playerLevel && (
                    <p className="text-xs text-gray-400">Level: {playerLevel}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render join/leave button
  const renderActionButton = () => {
    if (event.status === 'completed' || new Date() > new Date(`${event.date}T${event.time}`)) {
      return null;
    }
    
    if (isPlayerInEvent) {
      return (
        <button
          onClick={handleLeaveEvent}
          className="w-full bg-[#FF3B3B] hover:bg-[#E02F2F] text-white font-medium py-3 px-4 rounded-lg transition duration-200"
          disabled={isLoading || actionInProgress}
        >
          {actionInProgress ? <span className="animate-pulse">Processing...</span> : 'Leave Game'}
        </button>
      );
    } else if (event.players && event.players.length < event.maxPlayers) {
      return (
        <button
          onClick={handleJoinEvent}
          className="w-full bg-[#C1FF2F] hover:bg-[#a4e620] text-[#161723] font-medium py-3 px-4 rounded-lg transition duration-200"
          disabled={isLoading || actionInProgress}
        >
          {actionInProgress ? <span className="animate-pulse">Processing...</span> : 'Join Game'}
        </button>
      );
    } else {
      return (
        <button
          className="w-full bg-[#252736] text-white font-medium py-3 px-4 rounded-lg cursor-not-allowed"
          disabled
        >
          Game Full
        </button>
      );
    }
  };

  // Determine if the current user is the creator
  const isCreator = user?.uid === event.createdBy;

  return (
    <div className="min-h-screen bg-[#121212] pb-24 md:pb-8 text-white">
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#C1FF2F]"></div>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-screen bg-[#161723]">
          <p className="text-center text-gray-500">{error}</p>
        </div>
      ) : (
        <>
          <div className="relative max-w-4xl mx-auto mt-0 md:mt-6">
            {coverImageUrl && (
              <img
                src={coverImageUrl}
                alt={event.location}
                className="w-full h-64 md:h-96 object-cover md:rounded-t-lg md:rounded-b-lg"
                onError={(e) => {
                  e.currentTarget.src = '/default-location.jpg';
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[rgb(18_18_18/var(--tw-bg-opacity))] to-transparent md:rounded-lg"></div>
            
            {/* Back button for mobile */}
            <button 
              onClick={() => navigate(-1)} 
              className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 rounded-full p-2 md:hidden"
              aria-label="Back"
            >
              <ArrowLeftIcon className="text-white" />
            </button>
            
            <div className="absolute bottom-0 left-0 p-4 md:p-6">
              <div className="text-[#C1FF2F] font-medium text-sm md:text-base mb-1">{event.sportType || 'Padel'}</div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">{event.title}</h1>
              <p className="text-gray-300">
                {formatDateForDisplay(event.date)} at {event.time}
              </p>
            </div>
            <div className="absolute top-4 right-4 flex space-x-2">
              <div className="bg-[#252736] text-white text-xs rounded-full px-3 py-1 flex items-center">
                <span>{event.players?.filter(player => player && player.id).length || 0}/{event.maxPlayers} Players</span>
              </div>
              {event.status === 'completed' ? (
                <div className="bg-gray-600 text-white text-xs rounded-full px-3 py-1 flex items-center">
                  <span>Event Finished</span>
                </div>
              ) : new Date() > new Date(`${event.date}T${event.time}`) ? (
                <div className="bg-red-600 text-white text-xs rounded-full px-3 py-1 flex items-center">
                  <span>Event Expired</span>
                </div>
              ) : (
                <div className="bg-[#C1FF2F] text-[#161723] text-xs rounded-full px-3 py-1 flex items-center">
                  <span>Active Event</span>
                </div>
              )}
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-4 md:px-6 mt-4 md:mt-10 pb-24 md:pb-0">
            <div className="flex justify-end space-x-2 mb-6">
              <button
                onClick={handleShareEvent}
                className="flex items-center space-x-1 text-gray-300 hover:text-[#C1FF2F]"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                </svg>
                <span>Share</span>
              </button>
              <button
                onClick={handleSaveEvent}
                disabled={savingEvent}
                className="p-2 rounded-full bg-[#2A2A2A] text-white"
              >
                {isSaved ? (
                  <BookmarkIcon style={{ color: '#C1FF2F' }} />
                ) : (
                  <BookmarkBorderIcon />
                )}
              </button>
              {(isUserCreator || currentUser?.isAdmin) && (
                <>
                  <button
                    onClick={handleEdit}
                    className="flex items-center space-x-1 text-gray-300 hover:text-[#C1FF2F]"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                    </svg>
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center space-x-1 text-gray-300 hover:text-red-500"
                  >
                    <DeleteIcon className="h-5 w-5" />
                    <span>Delete</span>
                  </button>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="bg-[rgb(30_30_30/var(--tw-bg-opacity))] rounded-lg p-4 mb-6">
                  <h2 className="text-lg font-semibold mb-4 text-white">Time</h2>
                  <div className="flex items-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-white">{formatDateForDisplay(event.date)}</span>
                  </div>
                  <div className="flex items-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-white">Start: {event.time}</span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-white">End: {calculateEndTime(event.time)}</span>
                  </div>
                </div>

                <div className="bg-[rgb(30_30_30/var(--tw-bg-opacity))] rounded-lg p-4 mb-6">
                  <h2 className="text-lg font-semibold mb-4 text-white">Event Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-gray-400 text-sm">Level</h3>
                      <p className="text-white">{event.level}</p>
                    </div>
                    <div>
                      <h3 className="text-gray-400 text-sm">Price</h3>
                      <p className="text-white">{event.price} €</p>
                    </div>
                    <div>
                      <h3 className="text-gray-400 text-sm">Sport</h3>
                      <p className="text-white">{event.sportType || 'Padel'}</p>
                    </div>
                    <div>
                      <h3 className="text-gray-400 text-sm">Status</h3>
                      <p className={event.status === 'completed' ? 'text-red-500' : 'text-[#C1FF2F]'}>
                        {event.status === 'completed' ? 'Completed' : 'Active'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[rgb(30_30_30/var(--tw-bg-opacity))] rounded-lg p-4 mb-6">
                  <h3 className="text-xl font-semibold mb-4 text-white">Players ({event.players.filter(player => player && player.id).length}/{event.maxPlayers})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {event.players.filter(player => player && player.id).map((player, index) => {
                      // Determine if player is an object or string
                      const playerId = isPlayerObject(player) ? player.id : player;
                      const playerName = isPlayerObject(player) ? (player.displayName || player.name) : 'Unknown';
                      const playerPhotoSrc = isPlayerObject(player) && player.photoURL;
                      const playerLevel = isPlayerObject(player) ? player.level : null;
                      
                      // Handle avatar sources properly
                      let avatarSrc = '/images/default-avatar.png';
                      if (playerPhotoSrc) {
                        // Check if it's a reference to one of our imported avatars
                        if (playerPhotoSrc === 'Avatar1' || playerPhotoSrc === 'Avatar2' || 
                            playerPhotoSrc === 'Avatar3' || playerPhotoSrc === 'Avatar4') {
                          avatarSrc = avatars[playerPhotoSrc as keyof typeof avatars];
                        } else {
                          avatarSrc = playerPhotoSrc;
                        }
                      }
                      
                      return (
                        <div 
                          key={`player-${index}-${playerId || 'unknown'}`} 
                          className="flex items-center space-x-2 my-2 p-3 bg-[rgb(35_35_35/var(--tw-bg-opacity))] rounded-lg hover:bg-[rgb(40_40_40/var(--tw-bg-opacity))] cursor-pointer"
                          onClick={() => handleViewProfile(playerId)}
                        >
                          <img 
                            src={avatarSrc}
                            alt={`Player ${index + 1}`} 
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => { e.currentTarget.src = '/images/default-avatar.png' }}
                          />
                          <div>
                            <p className="font-medium text-white">{playerName}</p>
                            {playerLevel && (
                              <p className="text-xs text-gray-400">Level: {playerLevel}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Match results and share memory buttons */}
                {event.status === 'completed' && event.matchResults && (
                  <div className="mt-6">
                    <button
                      onClick={() => setResultsDialogOpen(true)}
                      className="w-full bg-[#C1FF2F] hover:bg-[#a4e620] text-[#161723] font-medium py-2 px-4 rounded-lg transition duration-200 mb-4"
                    >
                      View Match Results
                    </button>
                    
                    {isPlayerInEvent && (
                      <button
                        onClick={handleShareMemory}
                        className="w-full bg-[#151515] hover:bg-[#1A1A1A] text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center"
                      >
                        <CameraIcon className="mr-2" />
                        Share memories
                      </button>
                    )}
                  </div>
                )}

                {event.status === 'completed' && !event.matchResults && (
                  <div className="mt-6">
                    {isPlayerInEvent && (
                      <button
                        onClick={handleShareMemory}
                        className="w-full bg-[#151515] hover:bg-[#1A1A1A] text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center"
                      >
                        <CameraIcon className="mr-2" />
                        Share memories
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="bg-[rgb(30_30_30/var(--tw-bg-opacity))] rounded-lg p-4 mb-6">
                  <h2 className="text-lg font-semibold mb-4 text-white">Location</h2>
                  {locationData?.coordinates && (
                    <div className="w-full h-64 rounded-lg overflow-hidden">
                      <Map
                        mapLib={Promise.resolve(maplibregl)}
                        initialViewState={{
                          longitude: locationData.coordinates.lng,
                          latitude: locationData.coordinates.lat,
                          zoom: 14
                        }}
                        style={{ width: '100%', height: '100%' }}
                        mapStyle="https://api.maptiler.com/maps/streets-v2-dark/style.json?key=33rTk4pHojFrbxONf77X"
                        attributionControl={false}
                        onError={(e: Error) => console.error("Map error:", e)}
                      >
                        <Marker
                          longitude={locationData.coordinates.lng}
                          latitude={locationData.coordinates.lat}
                        >
                          <div className="w-6 h-6 bg-[#C1FF2F] rounded-full flex items-center justify-center transform -translate-x-3 -translate-y-3">
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                          </div>
                        </Marker>
                      </Map>
                    </div>
                  )}
                  
                  {/* Location name and address below the map */}
                  <div className="mt-4">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-white">{locationData ? locationData.name : 'Loading...'}</span>
                    </div>
                    
                    {/* Only show "Learn More" button for Padel locations */}
                    {event && event.sportType === 'Padel' && locationData && (
                      <div className="mt-3">
                        <button 
                          onClick={() => navigate(`/location/${encodeURIComponent(locationData.name)}`)}
                          className="bg-[#1E1E1E] hover:bg-[#2A2A2A] text-[#C1FF2F] text-sm py-2 px-4 rounded-lg border border-[#3A3A3A] flex items-center transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Learn more about this location
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[rgb(30_30_30/var(--tw-bg-opacity))] rounded-lg p-4">
                  <h2 className="text-lg font-semibold mb-4 text-white">Created By</h2>
                  {creatorInfo && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <img
                          src={
                            creatorInfo.photoURL && 
                            (creatorInfo.photoURL === 'Avatar1' || 
                             creatorInfo.photoURL === 'Avatar2' || 
                             creatorInfo.photoURL === 'Avatar3' || 
                             creatorInfo.photoURL === 'Avatar4') 
                              ? avatars[creatorInfo.photoURL as keyof typeof avatars] 
                              : (creatorInfo.photoURL || '/images/default-avatar.png')
                          }
                          alt={creatorInfo.displayName}
                          className="w-10 h-10 rounded-full object-cover mr-3"
                          onError={(e) => { e.currentTarget.src = '/images/default-avatar.png' }}
                        />
                        <div>
                          <div className="flex items-center">
                            <p className="font-medium text-white">{creatorInfo.displayName}</p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleViewProfile(event.createdBy)}
                        className="text-[#C1FF2F] hover:text-[#a4e620] text-sm"
                      >
                        View Profile
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile sticky button */}
          {event.status !== 'completed' && new Date() < new Date(`${event.date}T${event.time}`) && (
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-[#121212] shadow-lg border-t border-gray-800 z-30">
              <div className="max-w-4xl mx-auto">
                {renderActionButton()}
              </div>
            </div>
          )}

          {/* Desktop Sticky Bar (The one we are keeping) */}
          <EventStickyBar 
            event={event}
            user={currentUser}
            isJoined={isPlayerInEvent}
            isPastEvent={new Date() > new Date(`${event.date}T${event.time}`)}
            onJoin={handleJoinEvent}
            onLeave={handleLeaveEvent}
            isLoading={actionInProgress}
          />
        </>
      )}

      {isProfileOpen && selectedUserId && (
        <UserProfileDialog 
          open={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          userId={selectedUserId}
        />
      )}

      {/* Edit Event Dialog */}
      {event && (
        <EditEventDialog
          open={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onEventUpdated={() => {
            // Refresh event data after update
            window.location.reload();
          }}
          eventId={event.id}
        />
      )}

      {/* Share Event Dialog */}
      {shareDialogOpen && event && (
        <ShareEventDialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          eventId={event.id}
          eventDetails={{
            title: event.title,
            date: event.date,
            time: event.time,
            location: event.location
          }}
        />
      )}

      {/* Share Memory Dialog */}
      {event && (
        <ShareMemoryDialog
          open={shareMemoryDialogOpen}
          onClose={() => setShareMemoryDialogOpen(false)}
          event={event}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E1E1E] rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-white">Delete Event</h2>
            <p className="text-gray-300 mb-6">Are you sure you want to delete this event? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEvent}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails; 