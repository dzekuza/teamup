import { FC, useState, useRef, useEffect } from 'react';
import { addDoc, collection, getDocs, query, where, getDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useClickOutside } from '../hooks/useClickOutside';
import { SuccessMessage } from './SuccessMessage';
import { Dialog } from '@headlessui/react';
import { Event, Player } from '../types';
import { PADEL_LOCATIONS, Location } from '../constants/locations';
import { sendEventInvitation, sendEventCreationEmail } from '../services/sendGridService';
import { createNotification } from '../services/notificationService';
import {
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  RadioGroup,
  IconButton,
  Button,
  Avatar,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import StyledRadio from './StyledRadio';
import { addToAppleWallet } from '../utils/appleWallet';
import { LocationSearch } from './LocationSearch';

interface CreateEventDialogProps {
  open: boolean;
  onClose: () => void;
  onEventCreated: () => void;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6;

interface FriendInfo {
  id: string;
  displayName: string;
  photoURL?: string;
  email?: string;
}

const SPORTS = [
  { id: 'Padel', name: 'Padel', icon: '🎾' },
  { id: 'Tennis', name: 'Tennis', icon: '🎾' },
  { id: 'Running', name: 'Running', icon: '🏃' },
  { id: 'Soccer', name: 'Soccer', icon: '⚽' },
  { id: 'Basketball', name: 'Basketball', icon: '🏀' },
  { id: 'Cycling', name: 'Cycling', icon: '🚴' },
];

export const CreateEventDialog: FC<CreateEventDialogProps> = ({ open, onClose, onEventCreated }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [sportType, setSportType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [customLocationCoordinates, setCustomLocationCoordinates] = useState<{lat: number; lng: number} | null>(null);
  const [date, setDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState<string>('0');
  const [level, setLevel] = useState<Event['level']>('Beginner');
  const [maxPlayers, setMaxPlayers] = useState<string>('4');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [eventPrivacy, setEventPrivacy] = useState('public');
  const [showSuccessOptions, setShowSuccessOptions] = useState(false);
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [friendsList, setFriendsList] = useState<FriendInfo[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  
  // Mobile-specific state - moved outside conditional rendering
  const [isVisible, setIsVisible] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activeTimeField, setActiveTimeField] = useState<'start' | 'end'>('start');
  const [selectedHour, setSelectedHour] = useState(1);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedSecond, setSelectedSecond] = useState(0);
  const [selectedAmPm, setSelectedAmPm] = useState<'AM' | 'PM'>('PM');
  const timePickerRef = useRef<HTMLDivElement>(null);

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useClickOutside(dialogRef, () => {
    if (!showSuccess) {
      onClose();
    }
  });

  useEffect(() => {
    if (shouldNavigate && eventId) {
      navigate(`/event/${eventId}`);
      setShouldNavigate(false);
    }
  }, [shouldNavigate, eventId, navigate]);

  // Mobile animation visibility effect - moved outside conditional rendering
  useEffect(() => {
    if (isMobile) {
      if (open) {
        setIsVisible(true);
      } else {
        // Add a delay to allow the animation to complete before hiding
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [open, isMobile]);

  // Fetch friends info when dialog opens and user has friends
  useEffect(() => {
    const fetchFriendsInfo = async () => {
      if (!open || !user) return;
      
      setLoadingFriends(true);
      try {
        // Get the user's friends directly from Firestore
        const friendsDoc = await getDoc(doc(db, 'friends', user.uid));
        let friendIds: string[] = [];
        
        if (friendsDoc.exists()) {
          const friendsData = friendsDoc.data();
          friendIds = friendsData.friends || [];
        }
        
        if (friendIds.length === 0) {
          setFriendsList([]);
          setLoadingFriends(false);
          return;
        }
        
        const friendsData: FriendInfo[] = [];
        
        for (const friendId of friendIds) {
          const friendDoc = await getDoc(doc(db, 'users', friendId));
          if (friendDoc.exists()) {
            const data = friendDoc.data();
            friendsData.push({
              id: friendId,
              displayName: data.displayName || 'Unknown User',
              photoURL: data.photoURL,
              email: data.email
            });
          }
        }
        
        setFriendsList(friendsData);
      } catch (error) {
        console.error('Error fetching friends info:', error);
      } finally {
        setLoadingFriends(false);
      }
    };
    
    fetchFriendsInfo();
  }, [open, user]);

  // Mobile touch event handlers - moved outside conditional rendering
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
    setTouchEnd(null);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    // Determine distance of swipe
    const distance = touchEnd - touchStart;
    
    // If distance is greater than 100px, consider it a swipe down
    if (distance > 100) {
      onClose();
    }
    
    // Reset touch values
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Generate preset dates
  const getPresetDates = () => {
    const dates = [];
    const today = new Date();
    
    // Add next 4 days
    for (let i = 0; i < 4; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: i === 0 
          ? 'Today'
          : i === 1 
            ? 'Tomorrow' 
            : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    
    return dates;
  };

  const presetDates = getPresetDates();

  const resetForm = () => {
    setSportType('');
    setTitle('');
    setDescription('');
    setLocation('');
    setCustomLocationCoordinates(null);
    setDate('');
    setStartTime('');
    setEndTime('');
    setIsPaid(false);
    setPrice('0');
    setLevel('Beginner');
    setMaxPlayers('4');
    setError('');
    setCurrentStep(1);
    setIsPrivate(false);
    setPassword('');
    setSelectedFriends([]);
    setInvitedEmails([]);
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartTime = e.target.value;
    setStartTime(newStartTime);
    
    // If end time is not set or is earlier than start time, set it to start time + 1 hour
    if (!endTime || endTime <= newStartTime) {
      const [hours, minutes] = newStartTime.split(':');
      const endDate = new Date();
      endDate.setHours(parseInt(hours) + 1);
      endDate.setMinutes(parseInt(minutes));
      setEndTime(endDate.toTimeString().slice(0, 5));
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return sportType !== '';
      case 2:
        return date !== null && startTime !== '';
      case 3:
        if (sportType === 'Padel') {
          return PADEL_LOCATIONS.some(loc => loc.name === location);
        }
        return location.trim() !== '';
      case 4:
        return level !== '' && maxPlayers !== '';
      case 5:
        return true; // Privacy settings are optional
      case 6:
        // Allow proceeding if either friends are selected or emails are added
        // Also enforce the rule that if 2 friends are selected, only 1 additional participant is allowed
        const totalParticipants = selectedFriends.length + invitedEmails.length;
        const maxAllowedParticipants = parseInt(maxPlayers) - 1; // -1 for the event creator
        return totalParticipants <= maxAllowedParticipants && 
               (selectedFriends.length < 2 || invitedEmails.length <= 1);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 6 && canProceedToNextStep()) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canProceedToNextStep()) return;

    // Only validate Padel location for Padel events
    if (sportType === 'Padel') {
      const selectedLocation = PADEL_LOCATIONS.find((loc: Location) => loc.name === location);
      if (!selectedLocation) return;
    } else if (!location) {
      setError('Please enter a location');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Initialize players array with the creator
      const players: Player[] = [{
        id: user.uid,
        name: user.displayName || 'Unknown Player',
        photoURL: user.photoURL || undefined
      }];

      // Add selected friends as players
      if (selectedFriends.length > 0) {
        for (const friendId of selectedFriends) {
          const friendDoc = await getDoc(doc(db, 'users', friendId));
          if (friendDoc.exists()) {
            const friendData = friendDoc.data();
            players.push({
              id: friendId,
              name: friendData.displayName || 'Unknown Player',
              photoURL: friendData.photoURL || undefined
            });
          }
        }
      }

      // Generate a title if not provided
      const eventTitle = title.trim() || `${sportType} Event at ${location}`;

      const eventData: Omit<Event, 'id'> = {
        title: eventTitle,
        date,
        time: startTime,
        endTime,
        location,
        level,
        players,
        maxPlayers: parseInt(maxPlayers),
        createdBy: user.uid,
        price: isPaid ? parseFloat(price) : 0,
        status: 'active',
        isPrivate,
        sportType,
        description,
        ...(isPrivate && { password }),
        ...(customLocationCoordinates && { customLocationCoordinates })
      };

      const docRef = await addDoc(collection(db, 'events'), eventData);
      const newEvent: Event = { ...eventData, id: docRef.id };
      setEventId(docRef.id);
      
      // Send event creation email to the creator
      if (user.email) {
        try {
          await sendEventCreationEmail(user.email, newEvent);
        } catch (emailError) {
          console.error('Error sending event creation email:', emailError);
        }
      }
      
      // Send notifications and invitation emails to selected friends
      if (selectedFriends.length > 0) {
        try {
          for (const friendId of selectedFriends) {
            const friendDoc = await getDoc(doc(db, 'users', friendId));
            if (friendDoc.exists()) {
              const friendData = friendDoc.data();
              
              // Create notification
              await createNotification({
                type: 'new_event',
                eventId: docRef.id,
                eventTitle: eventTitle,
                createdBy: user.uid,
                createdAt: new Date().toISOString(),
                read: false,
                userId: friendId
              });

              // Send email invitation if email is available
              if (friendData.email) {
                await sendEventInvitation(
                  friendData.email,
                  eventTitle,
                  date,
                  `${startTime} - ${endTime}`,
                  location,
                  user.displayName || user.email || 'A friend'
                );
              }
            }
          }
        } catch (error) {
          console.error('Error sending friend notifications and invitations:', error);
        }
      }

      // Send invitations to additional email addresses
      if (invitedEmails.length > 0) {
        try {
          for (const email of invitedEmails) {
            await sendEventInvitation(
              email,
              eventTitle,
              date,
              `${startTime} - ${endTime}`,
              location,
              user.displayName || user.email || 'A friend'
            );
          }
        } catch (error) {
          console.error('Error sending email invitations:', error);
        }
      }
      
      setShowSuccess(true);
      setEventDetails(newEvent);
    } catch (err) {
      setError('Failed to create event');
      console.error('Error creating event:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onClose();
    if (onEventCreated) {
      onEventCreated();
    }
    if (eventId) {
      setShouldNavigate(true);
    }
  };

  const handleAddEmail = async () => {
    if (inviteEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      if (!invitedEmails.includes(inviteEmail)) {
        // Check if user with this email exists
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', inviteEmail));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // User exists, create friend request
          const targetUser = querySnapshot.docs[0];
          try {
            await addDoc(collection(db, `friends/${targetUser.id}/requests`), {
              fromUserId: user!.uid,
              toUserId: targetUser.id,
              status: 'pending',
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            console.error('Error creating friend request:', error);
          }
        }
        
        setInvitedEmails([...invitedEmails, inviteEmail]);
        setInviteEmail('');
      }
    }
  };

  const handleRemoveEmail = (email: string) => {
    setInvitedEmails(invitedEmails.filter(e => e !== email));
  };

  const handleToggleFriend = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleAddToAppleWallet = async () => {
    if (eventDetails) {
      const success = await addToAppleWallet({
        title: eventDetails.title,
        startDate: new Date(eventDetails.date),
        endDate: new Date(eventDetails.date),
        location: eventDetails.location,
        description: eventDetails.title
      });

      if (success) {
        // Show success message or handle accordingly
        console.log('Event added to Apple Wallet');
      }
    }
  };

  // Update sport type and reset relevant fields based on sport selection
  const handleSportTypeChange = (type: string) => {
    setSportType(type);
    // Set default level based on sport type
    if (type === 'Padel') {
      setLevel('C');
    } else {
      setLevel('Beginner');
    }
    // Reset location when changing sport type
    setLocation('');
  };

  // Handle location selection for non-Padel events
  const handleLocationSelect = (selectedLocation: { name: string; address: string; coordinates: { lat: number; lng: number } }) => {
    setLocation(selectedLocation.address);
    setCustomLocationCoordinates(selectedLocation.coordinates);
  };

  // Close time picker when clicking outside
  useClickOutside(timePickerRef, () => {
    if (showTimePicker) {
      setShowTimePicker(false);
    }
  });

  // Generate arrays for hour, minute, and second options
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const seconds = Array.from({ length: 60 }, (_, i) => i);

  // Handle opening the time picker
  const handleOpenTimePicker = (field: 'start' | 'end') => {
    setActiveTimeField(field);
    
    // Parse current time from startTime or endTime
    const timeValue = field === 'start' ? startTime : endTime;
    if (timeValue) {
      const [hourStr, minuteStr] = timeValue.split(':');
      let hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);
      
      // Convert from 24-hour to 12-hour format
      const amPm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12 || 12; // Convert 0 to 12
      
      setSelectedHour(hour);
      setSelectedMinute(minute);
      setSelectedSecond(0);
      setSelectedAmPm(amPm);
    } else {
      // Default to 1:30 PM if no time is set
      setSelectedHour(1);
      setSelectedMinute(30);
      setSelectedSecond(0);
      setSelectedAmPm('PM');
    }
    
    setShowTimePicker(true);
  };

  // Handle time selection
  const handleTimeConfirm = () => {
    // Convert from 12-hour to 24-hour format
    let hour24 = selectedHour;
    if (selectedAmPm === 'PM' && selectedHour < 12) {
      hour24 += 12;
    } else if (selectedAmPm === 'AM' && selectedHour === 12) {
      hour24 = 0;
    }
    
    // Format time as HH:MM
    const formattedTime = `${hour24.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    
    // Update the appropriate time field
    if (activeTimeField === 'start') {
      setStartTime(formattedTime);
      
      // Update end time if necessary
      if (!endTime || endTime <= formattedTime) {
        // Set end time to start time + 1 hour
        let endHour = hour24 + 1;
        if (endHour >= 24) endHour -= 24;
        const endFormattedTime = `${endHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
        setEndTime(endFormattedTime);
      }
    } else {
      setEndTime(formattedTime);
    }
    
    setShowTimePicker(false);
  };

  const handleCancelTimePicker = () => {
    setShowTimePicker(false);
  };

  // Format 24h time to 12h format for display
  const formatTimeFor12hDisplay = (time24h: string) => {
    if (!time24h) return '';
    
    const [hourStr, minuteStr] = time24h.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    
    const amPm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12; // Convert 0 to 12
    
    return `${hour}:${minute.toString().padStart(2, '0')} ${amPm}`;
  };

  // Progress bar rendering function
  const renderProgressBar = () => {
    const totalSteps = 6;
    const stepPercent = (currentStep / totalSteps) * 100;
    
    return (
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{Math.round(stepPercent)}% Complete</span>
        </div>
        <div className="w-full bg-[#2A2A2A] h-2 rounded-full overflow-hidden">
          <div 
            className="bg-[#C1FF2F] h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${stepPercent}%` }}
          ></div>
        </div>
      </div>
    );
  };

  // Handle increment/decrement of player count
  const handlePlayerCountChange = (increment: boolean) => {
    const currentCount = parseInt(maxPlayers);
    if (increment && currentCount < 100) {
      setMaxPlayers((currentCount + 1).toString());
    } else if (!increment && currentCount > 1) {
      setMaxPlayers((currentCount - 1).toString());
    }
  };

  if (showSuccess && eventId) {
    const timeRange = `${startTime} - ${endTime}`;
    return (
      <SuccessMessage
        title="Event created"
        message="Your event is created successfully. Now, you can invite your friends to join your event! Share your link and enjoy the game"
        shareUrl={`${window.location.origin}/event/${eventId}`}
        onClose={handleSuccessClose}
        eventDetails={{
          title,
          date,
          time: timeRange,
          location
        }}
      />
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Select Sport Type</h3>
            <p className="text-gray-400">Choose the type of sport for your event</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              {SPORTS.map((sport) => (
                <button
                  key={sport.id}
                  onClick={() => handleSportTypeChange(sport.id)}
                  className={`p-4 rounded-xl transition-colors ${
                    sportType === sport.id
                      ? 'bg-[#C1FF2F] text-black'
                      : 'bg-[#2A2A2A] text-white hover:bg-[#3A3A3A]'
                  }`}
                >
                  <span className="text-2xl">{sport.icon}</span>
                  <p className="mt-2 font-medium">{sport.name}</p>
                </button>
              ))}
            </div>
            
            {sportType && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Event Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your event, provide additional details..."
                  className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F] min-h-[100px] resize-y"
                />
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400">Event Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`${sportType} Event`}
                className="mt-1 block w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400">Date</label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {presetDates.map((presetDate) => (
                  <button
                    key={presetDate.value}
                    type="button"
                    onClick={() => setDate(presetDate.value)}
                    className={`p-2 rounded-xl text-center ${
                      date === presetDate.value
                        ? 'bg-[#C1FF2F] text-black'
                        : 'bg-[#2A2A2A] text-white hover:bg-[#3A3A3A]'
                    }`}
                  >
                    {presetDate.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="mt-2 text-[#C1FF2F] text-sm hover:underline"
              >
                Choose another date
              </button>
              {showDatePicker && (
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-2 block w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                  min={new Date().toISOString().split('T')[0]}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400">Start Time</label>
                <button
                  type="button"
                  onClick={() => handleOpenTimePicker('start')}
                  className="mt-1 block w-full bg-[#2A2A2A] text-white text-left rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                >
                  {startTime ? formatTimeFor12hDisplay(startTime) : 'Select time'}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">End Time</label>
                <button
                  type="button"
                  onClick={() => handleOpenTimePicker('end')}
                  className="mt-1 block w-full bg-[#2A2A2A] text-white text-left rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                >
                  {endTime ? formatTimeFor12hDisplay(endTime) : 'Select time'}
                </button>
              </div>
            </div>

            {/* Time picker */}
            {showTimePicker && (
              <div 
                className="absolute z-50 bg-[#1E1E1E] rounded-xl shadow-lg overflow-hidden w-[calc(100%-2rem)]"
                ref={timePickerRef}
                style={{ 
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  maxWidth: isMobile ? '100%' : '320px'
                }}
              >
                <div className="p-4 flex items-center justify-between bg-[#121212] border-b border-gray-800">
                  <button 
                    type="button" 
                    className="text-gray-400 hover:text-gray-200" 
                    onClick={handleCancelTimePicker}
                  >
                    CANCEL
                  </button>
                  <div className="text-lg font-medium text-white">
                    {`${selectedHour}:${selectedMinute.toString().padStart(2, '0')} ${selectedAmPm}`}
                  </div>
                  <button 
                    type="button" 
                    className="text-[#C1FF2F] hover:text-[#a4e620] font-medium" 
                    onClick={handleTimeConfirm}
                  >
                    OK
                  </button>
                </div>
                
                <div className="flex text-center h-40 overflow-hidden">
                  {/* Hours */}
                  <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
                    {hours.map((hour) => (
                      <div 
                        key={`hour-${hour}`}
                        className={`py-3 cursor-pointer hover:bg-[#2A2A2A] ${
                          selectedHour === hour 
                            ? 'bg-[#2A2A2A] text-[#C1FF2F] font-bold' 
                            : 'text-gray-300'
                        }`}
                        onClick={() => setSelectedHour(hour)}
                      >
                        {hour}
                      </div>
                    ))}
                  </div>
                  
                  {/* Minutes */}
                  <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
                    {minutes.map((minute) => (
                      <div 
                        key={`minute-${minute}`}
                        className={`py-3 cursor-pointer hover:bg-[#2A2A2A] ${
                          selectedMinute === minute 
                            ? 'bg-[#2A2A2A] text-[#C1FF2F] font-bold' 
                            : 'text-gray-300'
                        }`}
                        onClick={() => setSelectedMinute(minute)}
                      >
                        {minute.toString().padStart(2, '0')}
                      </div>
                    ))}
                  </div>
                  
                  {/* AM/PM */}
                  <div className="flex-1 flex flex-col justify-center">
                    <div 
                      className={`py-3 cursor-pointer hover:bg-[#2A2A2A] ${
                        selectedAmPm === 'AM' 
                          ? 'bg-[#2A2A2A] text-[#C1FF2F] font-bold' 
                          : 'text-gray-300'
                      }`}
                      onClick={() => setSelectedAmPm('AM')}
                    >
                      AM
                    </div>
                    <div 
                      className={`py-3 cursor-pointer hover:bg-[#2A2A2A] ${
                        selectedAmPm === 'PM' 
                          ? 'bg-[#2A2A2A] text-[#C1FF2F] font-bold' 
                          : 'text-gray-300'
                      }`}
                      onClick={() => setSelectedAmPm('PM')}
                    >
                      PM
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPaid"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="w-4 h-4 text-[#C1FF2F] bg-[#2A2A2A] border-gray-600 rounded focus:ring-[#C1FF2F] focus:ring-opacity-25"
              />
              <label htmlFor="isPaid" className="ml-2 text-sm font-medium text-white">
                This is a paid event
              </label>
            </div>

            {isPaid && (
              <div>
                <label className="block text-sm font-medium text-gray-400">Price (€)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                  required
                />
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
            {sportType === 'Padel' ? (
              <div className="grid grid-cols-2 gap-4">
                {PADEL_LOCATIONS.map((loc) => (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => setLocation(loc.name)}
                    className={`w-full rounded-xl overflow-hidden ${
                      location === loc.name 
                        ? 'ring-2 ring-[#C1FF2F]' 
                        : 'hover:ring-2 hover:ring-gray-500'
                    }`}
                  >
                    <div className="relative h-36">
                      <img
                        src={loc.image}
                        alt={loc.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-sm font-medium line-clamp-2">
                          {loc.name}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <LocationSearch 
                  onLocationSelect={handleLocationSelect}
                  placeholder="Search for places, venues or addresses"
                />
                {location && (
                  <div className="mt-3 p-4 bg-[#2A2A2A] rounded-xl border border-[#3A3A3A]">
                    <div className="flex items-start gap-3">
                      <div className="bg-[#353535] p-2 rounded-lg">
                        📍
                      </div>
                      <div>
                        <p className="text-white font-medium">{location}</p>
                        {customLocationCoordinates && (
                          <p className="text-xs text-gray-400 mt-1">
                            GPS: {customLocationCoordinates.lat.toFixed(6)}, {customLocationCoordinates.lng.toFixed(6)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {!location && (
                  <p className="mt-2 text-gray-400 text-sm">
                    Search for a specific place, sports venue, or address for your event
                  </p>
                )}
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400">Level</label>
              {sportType === 'Padel' ? (
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as Event['level'])}
                  className="mt-1 block w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                  required
                >
                  <option value="D-">D-</option>
                  <option value="D">D</option>
                  <option value="D+">D+</option>
                  <option value="C-">C-</option>
                  <option value="C">C</option>
                  <option value="C+">C+</option>
                  <option value="B-">B-</option>
                  <option value="B">B</option>
                  <option value="B+">B+</option>
                  <option value="A-">A-</option>
                  <option value="A">A</option>
                  <option value="A+">A+</option>
                </select>
              ) : (
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as Event['level'])}
                  className="mt-1 block w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                  required
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400">Number of people for event</label>
              <div className="mt-1 flex items-center">
                <button
                  type="button"
                  onClick={() => handlePlayerCountChange(false)}
                  className="bg-[#2A2A2A] text-white p-2 rounded-l-xl hover:bg-[#3A3A3A] focus:outline-none focus:ring-1 focus:ring-[#C1FF2F]"
                >
                  <RemoveIcon fontSize="small" />
                </button>
                <div className="bg-[#2A2A2A] text-white py-2 px-4 text-center min-w-[60px]">
                  {maxPlayers}
                </div>
                <button
                  type="button"
                  onClick={() => handlePlayerCountChange(true)}
                  className="bg-[#2A2A2A] text-white p-2 rounded-r-xl hover:bg-[#3A3A3A] focus:outline-none focus:ring-1 focus:ring-[#C1FF2F]"
                >
                  <AddIcon fontSize="small" />
                </button>
              </div>
              {sportType === 'Padel' && (
                <p className="text-xs text-gray-400 mt-1">
                  Recommended: 4 players for Padel
                </p>
              )}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <label className="block text-sm font-medium text-gray-400">Event Privacy</label>
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-[#2A2A2A] rounded-xl hover:bg-[#3A3A3A] transition-colors cursor-pointer">
                <input
                  type="radio"
                  id="public"
                  name="privacy"
                  checked={!isPrivate}
                  onChange={() => setIsPrivate(false)}
                  className="h-4 w-4 text-[#C1FF2F] border-gray-600 focus:ring-[#C1FF2F] focus:ring-offset-0"
                />
                <label htmlFor="public" className="ml-3 text-white cursor-pointer">
                  <span className="block font-medium">Public Event</span>
                  <span className="block text-sm text-gray-400">Anyone can join this event</span>
                </label>
              </div>
              <div className="flex items-center p-4 bg-[#2A2A2A] rounded-xl hover:bg-[#3A3A3A] transition-colors cursor-pointer">
                <input
                  type="radio"
                  id="private"
                  name="privacy"
                  checked={isPrivate}
                  onChange={() => setIsPrivate(true)}
                  className="h-4 w-4 text-[#C1FF2F] border-gray-600 focus:ring-[#C1FF2F] focus:ring-offset-0"
                />
                <label htmlFor="private" className="ml-3 text-white cursor-pointer">
                  <span className="block font-medium">Private Event</span>
                  <span className="block text-sm text-gray-400">Only people with the password can join</span>
                </label>
              </div>
              {isPrivate && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                    placeholder="Enter password for private event"
                  />
                </div>
              )}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Invite Friends</h3>
            
            {/* Friend selection */}
            <div className="space-y-4">
              <h4 className="text-white font-medium">Select Friends</h4>
              
              {loadingFriends ? (
                <div className="flex justify-center p-4">
                  <CircularProgress size={24} style={{ color: '#C1FF2F' }} />
                </div>
              ) : friendsList.length === 0 ? (
                <p className="text-gray-400">You don't have any friends yet. Add friends from your profile or invite people by email.</p>
              ) : (
                <div className="space-y-2">
                  {friendsList.map(friend => (
                    <button
                      key={friend.id}
                      onClick={() => handleToggleFriend(friend.id)}
                      className={`w-full p-4 rounded-xl transition-colors flex items-center gap-3 ${
                        selectedFriends.includes(friend.id)
                          ? 'bg-[#C1FF2F] hover:bg-[#b1ef1f] text-black'
                          : 'bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white'
                      }`}
                    >
                      <Avatar 
                        src={typeof friend.photoURL === 'string' && friend.photoURL.startsWith('http') 
                          ? friend.photoURL 
                          : `/avatars/${friend.photoURL || 'Avatar1'}.png`} 
                        alt={friend.displayName}
                        sx={{ width: 40, height: 40 }}
                      />
                      <div className="text-left overflow-hidden">
                        <p className="font-medium truncate">{friend.displayName}</p>
                        {friend.email && (
                          <p className={`text-sm truncate ${selectedFriends.includes(friend.id) ? 'text-black/70' : 'text-gray-400'}`}>{friend.email}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Email invitations */}
            <div className="space-y-4">
              <h4 className="text-white font-medium">Invite by Email</h4>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 bg-[#2A2A2A] text-white rounded-xl px-4 py-2"
                />
                <button
                  onClick={handleAddEmail}
                  className="px-4 py-2 bg-[#C1FF2F] text-black rounded-xl hover:bg-[#b1ef1f] transition-colors"
                >
                  Add
                </button>
              </div>
              {invitedEmails.length > 0 && (
                <div className="space-y-2">
                  {invitedEmails.map(email => (
                    <div key={email} className="flex items-center justify-between bg-[#2A2A2A] rounded-xl p-3">
                      <span className="text-white truncate max-w-[70%]">{email}</span>
                      <button
                        onClick={() => handleRemoveEmail(email)}
                        className="text-red-500 hover:text-red-600 ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Warning message if needed */}
            {selectedFriends.length >= 2 && invitedEmails.length > 1 && (
              <p className="text-red-500">
                When inviting 2 friends, you can only add 1 additional participant by email.
              </p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  // Replace the conditional rendering for mobile with this:
  if (isMobile) {
    return (
      <div 
        className={`fixed inset-0 z-50 ${isVisible ? 'block' : 'hidden'}`}
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.5)', 
          transition: 'background-color 0.3s ease, opacity 0.3s ease',
          opacity: open ? 1 : 0
        }}
        onClick={onClose}
      >
        <div 
          className={`fixed inset-x-0 bottom-0 z-50 bg-[#1E1E1E] rounded-t-xl max-h-[90vh] overflow-auto transform transition-transform duration-300 ease-out ${open ? 'translate-y-0' : 'translate-y-full'}`}
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-full flex justify-center py-2">
            <div className="w-10 h-1 bg-gray-500 rounded-full"></div>
          </div>
          <div className="p-4">
            {renderProgressBar()}
            {renderStepContent()}
            
            {error && <p className="text-red-500 mt-4">{error}</p>}
            
            <div className="flex justify-between mt-6">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 bg-[#2A2A2A] text-white rounded-lg"
                >
                  Back
                </button>
              )}
              
              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceedToNextStep()}
                  className={`px-4 py-2 rounded-lg ml-auto ${
                    canProceedToNextStep()
                      ? 'bg-[#C1FF2F] text-black'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || !canProceedToNextStep()}
                  className={`px-4 py-2 rounded-lg ml-auto ${
                    !isLoading && canProceedToNextStep()
                      ? 'bg-[#C1FF2F] text-black'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? 'Creating...' : 'Create Event'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular desktop dialog
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel 
          className="bg-[#121212] rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          ref={dialogRef}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-xl font-semibold text-white">
                Create Event
              </Dialog.Title>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <CloseIcon />
              </button>
            </div>
            
            {renderProgressBar()}
            {renderStepContent()}
            
            {error && <p className="text-red-500 mt-4">{error}</p>}
            
            <div className="flex justify-between mt-6">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 bg-[#2A2A2A] text-white rounded-lg"
                >
                  Back
                </button>
              )}
              
              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceedToNextStep()}
                  className={`px-4 py-2 rounded-lg ml-auto ${
                    canProceedToNextStep()
                      ? 'bg-[#C1FF2F] text-black'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || !canProceedToNextStep()}
                  className={`px-4 py-2 rounded-lg ml-auto ${
                    !isLoading && canProceedToNextStep()
                      ? 'bg-[#C1FF2F] text-black'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? 'Creating...' : 'Create Event'}
                </button>
              )}
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}; 