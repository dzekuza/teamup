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
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import StyledRadio from './StyledRadio';
import { addToAppleWallet } from '../utils/appleWallet';

interface CreateEventDialogProps {
  open: boolean;
  onClose: () => void;
  onEventCreated: () => void;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const SPORTS = [
  { id: 'Padel', name: 'Padel', icon: '🎾' },
  { id: 'Tennis', name: 'Tennis', icon: '🎾' },
  { id: 'Running', name: 'Running', icon: '🏃' },
  { id: 'Soccer', name: 'Soccer', icon: '⚽' },
  { id: 'Basketball', name: 'Basketball', icon: '🏀' },
  { id: 'Cycling', name: 'Cycling', icon: '🚴' },
];

export const CreateEventDialog: FC<CreateEventDialogProps> = ({ open, onClose, onEventCreated }) => {
  const { user, userFriends } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [sportType, setSportType] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
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
    setTitle('');
    setLocation('');
    setDate('');
    setStartTime('');
    setEndTime('');
    setPrice('0');
    setLevel('Beginner');
    setMaxPlayers('4');
    setError('');
    setCurrentStep(1);
    setIsPrivate(false);
    setPassword('');
    setSelectedFriends([]);
    setInvitedEmails([]);
    setSportType('');
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
        price: parseFloat(price),
        status: 'active',
        isPrivate,
        sportType,
        ...(isPrivate && { password }),
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
            
            <div className="grid grid-cols-2 gap-4">
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
                <input
                  type="time"
                  value={startTime}
                  onChange={handleStartTimeChange}
                  className="mt-1 block w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  min={startTime}
                  className="mt-1 block w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                  required
                />
              </div>
            </div>

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
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter event location"
                  className="mt-1 block w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                  required
                />
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
              <label className="block text-sm font-medium text-gray-400">Maximum Players</label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
                className="mt-1 block w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                required
              >
                <option value="4">4 players</option>
              </select>
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
              <div className="grid grid-cols-2 gap-4">
                {userFriends?.map(friendId => (
                  <button
                    key={friendId}
                    onClick={() => handleToggleFriend(friendId)}
                    className={`p-4 rounded-xl transition-colors ${
                      selectedFriends.includes(friendId)
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-[#2A2A2A] hover:bg-[#3A3A3A]'
                    }`}
                  >
                    {/* Friend name will be displayed here */}
                    {friendId}
                  </button>
                ))}
              </div>
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
              {invitedEmails.length > 0 && (
                <div className="space-y-2">
                  {invitedEmails.map(email => (
                    <div key={email} className="flex items-center justify-between bg-[#2A2A2A] rounded-xl p-2">
                      <span className="text-white">{email}</span>
                      <button
                        onClick={() => handleRemoveEmail(email)}
                        className="text-red-500 hover:text-red-600"
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

  return (
    <Dialog open={open} onClose={onClose} className="relative z-[60]">
      <div className="fixed inset-0 bg-black bg-opacity-50" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel 
          ref={dialogRef}
          className="bg-[#1E1E1E] rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col relative"
        >
          <div className="p-8">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            
            <Dialog.Title className="text-2xl font-medium text-white mb-6">
              Create New Event
            </Dialog.Title>

            {/* Progress indicator */}
            <div className="flex justify-between mb-8">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div
                  key={step}
                  className={`w-1/6 h-1 rounded-full mx-1 ${
                    step <= currentStep ? 'bg-[#C1FF2F]' : 'bg-[#2A2A2A]'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="px-8 pb-8 overflow-y-auto flex-1">
            <div className="space-y-4">
              {renderStepContent()}

              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}

              <div className="flex justify-between mt-8">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2 text-white hover:bg-[#2A2A2A] rounded-xl transition-colors"
                  >
                    Back
                  </button>
                )}
                
                <div className="ml-auto">
                  {currentStep < 6 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!canProceedToNextStep()}
                      className={`px-4 py-2 rounded-xl transition-colors ${
                        canProceedToNextStep()
                          ? 'bg-[#C1FF2F] text-black hover:bg-[#B1EF1F]'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isLoading || !canProceedToNextStep()}
                      className={`px-4 py-2 rounded-xl transition-colors ${
                        !isLoading && canProceedToNextStep()
                          ? 'bg-[#C1FF2F] text-black hover:bg-[#B1EF1F]'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isLoading ? 'Creating...' : 'Create Event'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}; 