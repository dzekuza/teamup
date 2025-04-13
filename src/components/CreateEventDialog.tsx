import { FC, useState, useRef } from 'react';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useClickOutside } from '../hooks/useClickOutside';
import { SuccessMessage } from './SuccessMessage';
import { Dialog } from '@headlessui/react';
import { Event } from '../types';
import { PADEL_LOCATIONS, Location } from '../constants/locations';
import { sendEventInvitation } from '../utils/emailService';
import { sendEventCreationEmail } from '../services/emailService';
import { createNotification } from '../services/notificationService';

interface CreateEventDialogProps {
  open: boolean;
  onClose: () => void;
  onEventCreated: () => void;
}

type Step = 1 | 2 | 3 | 4;

export const CreateEventDialog: FC<CreateEventDialogProps> = ({ open, onClose, onEventCreated }) => {
  const { user, userFriends } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
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
  const dialogRef = useRef<HTMLDivElement>(null);

  useClickOutside(dialogRef, () => {
    if (!showSuccess) {
      onClose();
    }
  });

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
        return title.trim() !== '';
      case 2:
        return location !== '';
      case 3:
        return date !== '' && startTime !== '' && endTime !== '' && !isNaN(parseFloat(price));
      case 4:
        return level !== '' && !isNaN(parseInt(maxPlayers));
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4 && canProceedToNextStep()) {
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

    const selectedLocation = PADEL_LOCATIONS.find((loc: Location) => loc.name === location);
    if (!selectedLocation) return;

    setIsLoading(true);
    setError('');

    try {
      const eventData: Omit<Event, 'id'> = {
        title,
        location,
        level,
        maxPlayers: parseInt(maxPlayers),
        createdBy: user.uid,
        date,
        time: startTime,
        endTime: endTime,
        players: [{
          id: user.uid,
          name: user.displayName || user.email || 'Unknown Player',
          photoURL: user.photoURL || undefined
        }],
        price: parseFloat(price),
        status: 'open'
      };

      const docRef = await addDoc(collection(db, 'events'), eventData);
      const newEvent: Event = { ...eventData, id: docRef.id };
      setEventId(docRef.id);
      
      // Send event creation email to the creator
      if (user.email) {
        try {
          await sendEventCreationEmail(newEvent, user.email);
        } catch (emailError) {
          console.error('Error sending event creation email:', emailError);
        }
      }
      
      // Send notifications and invitation emails to friends
      if (userFriends && userFriends.length > 0) {
        try {
          // Get friend emails and create notifications
          for (const friendId of userFriends) {
            const friendDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', friendId)));
            if (!friendDoc.empty) {
              const friendData = friendDoc.docs[0].data();
              
              // Create notification
              await createNotification({
                type: 'new_event',
                eventId: docRef.id,
                eventTitle: title,
                createdBy: user.uid,
                createdAt: new Date().toISOString(),
                read: false,
                userId: friendId
              });

              // Send email invitation if email is available
              if (friendData.email) {
                await sendEventInvitation(
                  friendData.email,
                  title,
                  date,
                  `${startTime} - ${endTime}`,
                  location,
                  user.displayName || user.email || 'A friend'
                );
              }
            }
          }
        } catch (error) {
          console.error('Error sending notifications and invitations:', error);
        }
      }
      
      setShowSuccess(true);
      resetForm();
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
      navigate(`/event/${eventId}`);
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
          <div>
            <label className="block text-sm font-medium text-gray-400">Event Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
              required
            />
          </div>
        );
      case 2:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
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
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
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
      case 4:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400">Level</label>
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
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`w-1/4 h-1 rounded-full mx-1 ${
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
                  {currentStep < 4 ? (
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