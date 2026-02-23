import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { Event, Player, MatchResult } from '../types';
import type { Profile } from '../types/supabase';
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
  FavoriteBorder as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
  CameraAlt as CameraIcon,
  Delete as DeleteIcon,
  SportsSoccer as SportsSoccerIcon
} from '@mui/icons-material';
import { ShareMemoryDialog } from '../components/ShareMemoryDialog';
import { EditEventDialog } from '../components/EditEventDialog';
import { ShareEventDialog } from '../components/ShareEventDialog';
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

const formatEventDayLabel = (dateString: string): string => {
  const eventDate = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(eventDate, today)) return 'Today';
  if (isSameDay(eventDate, tomorrow)) return 'Tomorrow';

  return eventDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

// Player data types helper
const isPlayerObject = (player: any): player is Player => {
  return player !== null && typeof player === 'object' && 'id' in player;
};

const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useSupabaseAuth();
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
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);
  const [interestedCount, setInterestedCount] = useState(0);
  const [shareMemoryDialogOpen, setShareMemoryDialogOpen] = useState(false);
  // Hide navigation on mobile screens when viewing event details
  const [hideNavigation, setHideNavigation] = useState(true);
  // Check if user is admin or creator of the event
  const isUserCreator = user?.id === event?.createdBy;
  
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
        const { data: eventRow, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();

        if (eventError || !eventRow) {
          setError('Event not found');
          return;
        }

        const [{ data: playersRows, error: playersError }, { data: matchRows, error: matchError }] = await Promise.all([
          supabase.from('event_players').select('*').eq('event_id', id),
          supabase.from('match_results').select('*').eq('event_id', id),
        ]);

        if (playersError) throw playersError;
        if (matchError) throw matchError;

        const mappedPlayers: Player[] = (playersRows || []).map(p => ({
          id: p.user_id,
          name: p.display_name || 'Unknown Player',
          photoURL: p.photo_url || undefined,
          displayName: p.display_name || undefined,
          level: p.level || undefined,
          uid: p.user_id,
        }));

        const mappedMatchResults: MatchResult[] = (matchRows || []).map(r => ({
          teamAScore: r.team_a_score,
          teamBScore: r.team_b_score,
          winner: r.winner,
        }));

        const eventData: Event = {
          id: eventRow.id,
          title: eventRow.title,
          date: eventRow.date,
          time: eventRow.time,
          endTime: eventRow.end_time,
          location: eventRow.location,
          level: eventRow.level,
          players: mappedPlayers,
          maxPlayers: eventRow.max_players,
          createdBy: eventRow.created_by,
          price: Number(eventRow.price),
          status: eventRow.status,
          isPrivate: eventRow.is_private,
          password: eventRow.password ?? undefined,
          sportType: eventRow.sport_type,
          description: eventRow.description ?? undefined,
          coverImageURL: eventRow.cover_image_url ?? undefined,
          createdAt: eventRow.created_at,
          customLocationCoordinates: eventRow.custom_location_lat != null
            ? { lat: eventRow.custom_location_lat, lng: eventRow.custom_location_lng }
            : undefined,
          matchResults: mappedMatchResults.length === 0
            ? undefined
            : mappedMatchResults.length === 1
              ? mappedMatchResults[0]
              : mappedMatchResults,
        };

        setEvent(eventData);
        setPlayers(mappedPlayers);

        if (user && mappedPlayers.length > 0) {
          const isPlayerInEvent = mappedPlayers.some(p => p.id === user.id);
          setIsPlayerInEvent(isPlayerInEvent);
        }

        if (eventData.sportType === 'Padel') {
          const locationObj = PADEL_LOCATIONS.find(loc => loc.name === eventData.location);
          setLocationData(locationObj || null);
        } else if (eventData.customLocationCoordinates) {
          setLocationData({
            name: eventData.location,
            address: eventData.location,
            coordinates: eventData.customLocationCoordinates,
            image: DEFAULT_COVER_IMAGE,
          });
        } else {
          setLocationData({
            name: eventData.location,
            address: eventData.location,
            coordinates: DEFAULT_COORDINATES,
            image: DEFAULT_COVER_IMAGE,
          });
        }

        if (eventData.createdBy) {
          const { data: creatorData, error: creatorError } = await supabase
            .from('profiles')
            .select('display_name, photo_url')
            .eq('id', eventData.createdBy)
            .single();

          if (!creatorError && creatorData) {
            setCreatorInfo({
              displayName: creatorData.display_name || 'Unknown User',
              photoURL: creatorData.photo_url || 'Avatar1',
            });
          }
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
      if (!user) {
        setCurrentUser(null);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching current user profile:', error);
        return;
      }

      setCurrentUser(data);
    };
    
    fetchCurrentUser();
  }, [user]);

  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!user || !event) return;
      
      try {
        const { data, error } = await supabase
          .from('saved_events')
          .select('id')
          .eq('user_id', user.id)
          .eq('event_id', event.id)
          .maybeSingle();

        if (error) throw error;

        setIsSaved(!!data);
        setInterestedCount(data ? 1 : 0);
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
      isPlayerObject(player) ? player.id === user.id : player === user.id
    );
    
    if (isAlreadyJoined) {
      toast.error('You have already joined this event');
      return;
    }

    try {
      setActionInProgress(true);
      const newPlayer: Player = {
        id: user.id,
        name: user.user_metadata?.display_name || user.email || 'Unknown Player',
        photoURL: user.user_metadata?.photo_url || undefined,
        displayName: user.user_metadata?.display_name || undefined,
        level: currentUser?.level || undefined,
      };

      const { count, error: countError } = await supabase
        .from('event_players')
        .select('user_id', { count: 'exact' })
        .eq('event_id', event.id);

      if (countError) throw countError;

      if ((count ?? 0) >= event.maxPlayers) {
        toast.error('This event is now full');
        return;
      }

      const { error: insertError } = await supabase
        .from('event_players')
        .insert({
          event_id: event.id,
          user_id: user.id,
          display_name: newPlayer.displayName || newPlayer.name,
          photo_url: newPlayer.photoURL || null,
          level: newPlayer.level || null,
        });

      if (insertError) throw insertError;

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
      const currentPlayer = event.players.find(p => 
        isPlayerObject(p) ? p.id === user.id : p === user.id
      );
      
      if (!currentPlayer) {
        toast.error('You are not in this event');
        return;
      }

      const { error: deleteError } = await supabase
        .from('event_players')
        .delete()
        .eq('event_id', event.id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Update local state with filtered player list
      const updatedPlayers = event.players.filter(p => 
        isPlayerObject(p) ? p.id !== user.id : p !== user.id
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
  const handleEditEvent = () => {
    setProfileDialogOpen(true);
  };

  // Add handle delete event function
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const handleDeleteEvent = async () => {
    if (!event || !user) return;
    
    try {
      setActionInProgress(true);
      
      // Check if user is creator or admin
      if (event.createdBy !== user.id && !(currentUser?.is_admin)) {
        toast.error('You do not have permission to delete this event');
        return;
      }
      
      const { error: deleteEventError } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);

      if (deleteEventError) throw deleteEventError;

      await supabase
        .from('saved_events')
        .delete()
        .eq('event_id', event.id);
      
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
      if (isSaved) {
        const { error: deleteError } = await supabase
          .from('saved_events')
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', event.id);

        if (deleteError) throw deleteError;

        setIsSaved(false);
        setInterestedCount(0); // Set to 0 since we're only tracking current user's status
        toast.success('Event removed from saved');
      } else {
        const { error: insertError } = await supabase
          .from('saved_events')
          .insert({
            user_id: user.id,
            event_id: event.id,
            saved_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;

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
    isPlayerObject(player) ? player.id === user.id : player === user.id
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
  const getPlayerAvatarSrc = (player: Player | string) => {
    if (!isPlayerObject(player)) return '/images/default-avatar.png';
    if (!player.photoURL) return '/images/default-avatar.png';

    if (
      player.photoURL === 'Avatar1' ||
      player.photoURL === 'Avatar2' ||
      player.photoURL === 'Avatar3' ||
      player.photoURL === 'Avatar4'
    ) {
      return avatars[player.photoURL as keyof typeof avatars];
    }

    return player.photoURL;
  };

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
          <div className="md:hidden bg-[#10130c] text-white">
            <div className="relative">
              {coverImageUrl && (
                <img
                  src={coverImageUrl}
                  alt={event.location}
                  className="w-full h-72 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/default-location.jpg';
                  }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[rgb(16_19_12/var(--tw-bg-opacity))] to-transparent"></div>

              <button
                onClick={() => navigate(-1)}
                className="absolute top-6 left-4 z-10 bg-[#b4d91e] rounded-full p-2"
                aria-label="Back"
              >
                <ArrowLeftIcon className="text-[#10130c]" />
              </button>

              <div className="absolute top-6 right-4 flex items-center gap-2">
                <button
                  onClick={handleSaveEvent}
                  disabled={savingEvent}
                  className="bg-[#1e1e1e] rounded-full p-2"
                  aria-label="Interested"
                >
                  {isSaved ? (
                    <FavoriteIcon className="text-[#b4d91e]" />
                  ) : (
                    <FavoriteBorderIcon className="text-white" />
                  )}
                </button>
                <button
                  onClick={handleShareEvent}
                  className="bg-[#1e1e1e] rounded-full p-2"
                  aria-label="Share"
                >
                  <ShareIcon className="text-white" />
                </button>
              </div>
            </div>

            <div className="-mt-10 rounded-t-3xl bg-[#10130c] px-5 pt-6 pb-28 relative z-10">
              <div className="flex flex-wrap gap-2">
                {event.sportType && (
                  <span className="border border-[#405200] text-[#708f00] text-sm px-3 py-1 rounded-lg">
                    {event.sportType}
                  </span>
                )}
                {event.level && (
                  <span className="border border-[#405200] text-[#708f00] text-sm px-3 py-1 rounded-lg">
                    {event.level}
                  </span>
                )}
                <span className="border border-[#405200] text-[#708f00] text-sm px-3 py-1 rounded-lg">
                  {event.isPrivate ? 'Private' : 'Public'}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-sm text-[#e1e1e1]">
                  {formatEventDayLabel(event.date)} · {event.time} - {event.endTime || calculateEndTime(event.time)}
                </p>
                <h1 className="text-2xl font-semibold text-[#e1e1e1]">{event.title}</h1>
                <p className="text-sm text-[#e1e1e1]">
                  {event.isPrivate ? 'Private' : 'Public'} · Event by{' '}
                  <button
                    onClick={() => handleViewProfile(event.createdBy)}
                    className="text-[#b4d91e] underline underline-offset-2"
                  >
                    {creatorInfo?.displayName || 'Unknown'}
                  </button>
                </p>
              </div>

              <div className="mt-4">
                <p className="text-sm text-[#e1e1e1]">
                  {event.players.filter(player => player && player.id).length} out of {event.maxPlayers} are going · {interestedCount} interested
                </p>
                <div className="mt-3 flex items-center">
                  {event.players.filter(player => player && player.id).slice(0, 4).map((player, index) => (
                    <div
                      key={`player-compact-${index}`}
                      className={`h-8 w-8 rounded-full border-2 border-[#10130c] overflow-hidden ${index > 0 ? '-ml-2' : ''}`}
                    >
                      <img
                        src={getPlayerAvatarSrc(player)}
                        alt="Player"
                        className="h-full w-full object-cover"
                        onError={(e) => { e.currentTarget.src = '/images/default-avatar.png'; }}
                      />
                    </div>
                  ))}
                  {event.players.filter(player => player && player.id).length > 4 && (
                    <div className="h-8 w-8 rounded-full bg-[#b4d91e] text-[#10130c] text-xs font-semibold flex items-center justify-center -ml-2">
                      +{event.players.filter(player => player && player.id).length - 4}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 border-t border-[#1d210d] pt-6">
                <div className="flex items-start justify-between text-center">
                  <div className="flex flex-col gap-2">
                    <span className="text-lg font-bold text-[#e1e1e1]">{event.level}</span>
                    <span className="text-sm text-[#8b9182]">Level</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-lg font-semibold text-[#e1e1e1]">
                      90 <span className="text-sm">min</span>
                    </span>
                    <span className="text-sm text-[#8b9182]">Duration</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-lg font-semibold text-[#e1e1e1]">{event.players.filter(player => player && player.id).length}</span>
                    <span className="text-sm text-[#8b9182]">Players</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-[#1d210d] pt-6">
                <h2 className="text-lg font-semibold text-[#e1e1e1]">Host comments</h2>
                <p className="mt-3 text-sm text-[#8b9182] leading-relaxed">
                  {event.description || 'No host comments yet.'}
                </p>
              </div>

              <div className="mt-6 border-t border-[#1d210d] pt-6">
                <h2 className="text-lg font-semibold text-[#e1e1e1]">Players</h2>
                <div className="mt-4 space-y-2">
                  {event.players.filter(player => player && player.id).map((player, index) => {
                    const playerId = isPlayerObject(player) ? player.id : player;
                    const playerName = isPlayerObject(player) ? (player.displayName || player.name) : 'Unknown';
                    const playerLevel = isPlayerObject(player) ? player.level : null;
                    return (
                      <div
                        key={`player-mobile-${index}-${playerId || 'unknown'}`}
                        className="bg-[#151905] rounded-lg px-4 py-3 flex items-center gap-4"
                        onClick={() => handleViewProfile(playerId)}
                      >
                        <img
                          src={getPlayerAvatarSrc(player)}
                          alt={playerName}
                          className="h-10 w-10 rounded-full object-cover"
                          onError={(e) => { e.currentTarget.src = '/images/default-avatar.png'; }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#e1e1e1]">{playerName}</p>
                          {playerLevel && (
                            <p className="text-xs text-[#8b9182]">{event.sportType || 'Padel'} · {playerLevel}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 border-t border-[#1d210d] pt-6">
                <h2 className="text-lg font-semibold text-[#e1e1e1]">Place of the game</h2>
                <div className="mt-4 border border-[#1d210d] rounded-2xl overflow-hidden">
                  {locationData?.coordinates && (
                    <div className="relative h-60">
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
                          <div className="w-12 h-12 bg-[#1d210d] border border-[#b4d91e] rounded-full flex items-center justify-center shadow-[0px_0px_30px_0px_rgba(180,217,30,0.6)]">
                            <SportsSoccerIcon className="text-[#b4d91e]" fontSize="small" />
                          </div>
                        </Marker>
                      </Map>
                    </div>
                  )}
                  <div className="bg-[#151905] px-4 py-3 text-sm text-[#e1e1e1]">
                    {locationData?.address || event.location}
                  </div>
                </div>
              </div>
            </div>

            {event.status !== 'completed' && new Date() < new Date(`${event.date}T${event.time}`) && (
              <div className="fixed bottom-0 left-0 right-0 bg-[#10130c] border-t border-[#1d210d] p-4">
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEvent}
                    disabled={savingEvent}
                    className="flex-1 bg-[#1d2615] text-white font-semibold py-3 rounded-lg"
                  >
                    Interested
                  </button>
                  <button
                    onClick={isPlayerInEvent ? handleLeaveEvent : handleJoinEvent}
                    disabled={isLoading || actionInProgress}
                    className={`flex-1 font-semibold py-3 rounded-lg ${isPlayerInEvent ? 'bg-[#FF3B3B] text-white' : 'bg-[#b4d91e] text-[#10130c]'}`}
                  >
                    {actionInProgress ? 'Processing...' : isPlayerInEvent ? 'Leave game' : 'Join game'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="hidden md:block">
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
              {(isUserCreator || currentUser?.is_admin) && (
                <>
                  <button
                    onClick={handleEditEvent}
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

                {/* Show join/leave button only on desktop */}
                <div className="hidden md:block mt-6">
                  {event.status !== 'completed' && new Date() < new Date(`${event.date}T${event.time}`) && (
                    <div>
                      {isPlayerInEvent ? (
                        <button
                          onClick={handleLeaveEvent}
                          className="w-full bg-[#FF3B3B] hover:bg-[#E02F2F] text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                          disabled={isLoading || actionInProgress}
                        >
                          {actionInProgress ? <span className="animate-pulse">Processing...</span> : 'Leave Game'}
                        </button>
                      ) : event.players && event.players.length < event.maxPlayers ? (
                        <button
                          onClick={handleJoinEvent}
                          className="w-full bg-[#C1FF2F] hover:bg-[#a4e620] text-[#161723] font-medium py-2 px-4 rounded-lg transition duration-200"
                          disabled={isLoading || actionInProgress}
                        >
                          {actionInProgress ? <span className="animate-pulse">Processing...</span> : 'Join Game'}
                        </button>
                      ) : (
                        <button
                          className="w-full bg-[#252736] text-white font-medium py-2 px-4 rounded-lg cursor-not-allowed"
                          disabled
                        >
                          Game Full
                        </button>
                      )}
                    </div>
                  )}
                </div>

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
          </div>
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
      {profileDialogOpen && event && (
        <EditEventDialog
          open={profileDialogOpen}
          onClose={() => setProfileDialogOpen(false)}
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
