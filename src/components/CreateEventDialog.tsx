import { FC, useState, useRef } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useClickOutside } from '../hooks/useClickOutside';
import { SuccessMessage } from './SuccessMessage';
import { LocationPicker } from './LocationPicker';
import { Dialog } from '@headlessui/react';

interface CreateEventDialogProps {
  open: boolean;
  onClose: () => void;
  onEventCreated: () => void;
}

export const CreateEventDialog: FC<CreateEventDialogProps> = ({ open, onClose, onEventCreated }) => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [level, setLevel] = useState('');
  const [maxPlayers, setMaxPlayers] = useState<number>(4);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDivElement>(null);

  useClickOutside(dialogRef, () => {
    if (!showSuccess) {
      onClose();
    }
  });

  const resetForm = () => {
    setTitle('');
    setLocation('');
    setCoordinates(null);
    setDate('');
    setTime('');
    setPrice(0);
    setLevel('');
    setMaxPlayers(4);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !coordinates) return;

    setIsLoading(true);
    setError('');

    try {
      // Split location into name and address
      const [locationName, address] = location.split(' - ');

      const eventData = {
        title,
        locationName,
        address,
        coordinates,
        date,
        time,
        price,
        level,
        maxPlayers,
        currentPlayers: 1,
        players: [user.uid],
        createdAt: new Date().toISOString(),
        createdBy: user.uid
      };

      const docRef = await addDoc(collection(db, 'events'), eventData);
      setEventId(docRef.id);
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
    onEventCreated();
    if (eventId) {
      navigate(`/event/${eventId}`);
    }
  };

  if (showSuccess && eventId) {
    return (
      <SuccessMessage
        title="Event created"
        message="Your event is created successfully. Now, you can invite your friends to join your event! Share your link and enjoy the game"
        shareUrl={`${window.location.origin}/event/${eventId}`}
        onClose={handleSuccessClose}
      />
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-2xl bg-[#1E1E1E] p-6 shadow-xl space-y-6">
          <Dialog.Title className="text-xl font-semibold text-white">
            Create new event
          </Dialog.Title>

          <div className="space-y-6">
            <div>
              <input
                type="text"
                placeholder="Event title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setCoordinates({ lat: 0, lng: 0 }); // Default coordinates
                }}
                className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                />
              </div>
              <div>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                />
              </div>
            </div>

            <div>
              <input
                type="number"
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
              />
            </div>

            <div>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
              >
                <option value="">Select level</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
              >
                <option value="4">4 players</option>
                <option value="3">3 players</option>
                <option value="2">2 players</option>
              </select>
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-white hover:bg-[#2A2A2A] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !title || !coordinates || !date || !time || !price || !level || !maxPlayers}
              className={`px-4 py-2 rounded-xl ${
                !isLoading && title && coordinates && date && time && price && level && maxPlayers
                  ? 'bg-[#C1FF2F] text-black hover:bg-opacity-90'
                  : 'bg-gray-500 cursor-not-allowed'
              } transition-colors`}
            >
              {isLoading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}; 