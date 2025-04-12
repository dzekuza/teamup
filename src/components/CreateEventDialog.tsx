import { FC, useState, useRef } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useClickOutside } from '../hooks/useClickOutside';
import { SuccessMessage } from './SuccessMessage';

const PADEL_LOCATIONS = [
  'Padel Vilnius - Liepkalnio g. 2C, Vilnius 02105',
  'Ozo Padel & Tennis - Ozo g. 14C, Vilnius 08200',
  'SET Padel Club - Kareivių g. 14, Vilnius 09117',
  'Tennis Pro Academy Padel - Naugarduko g. 76, Vilnius 03202',
  'GO9 Padel - Gedimino pr. 9, Vilnius 01103',
  'Padel House Vilnius - Žygio g. 97A, Vilnius 08234',
  'LTU Padel Club - Viršuliškių g. 40, Vilnius 05131'
];

interface CreateEventDialogProps {
  open: boolean;
  onClose: () => void;
  onEventCreated: () => void;
}

export const CreateEventDialog: FC<CreateEventDialogProps> = ({ open, onClose, onEventCreated }) => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [price, setPrice] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('4');
  const [level, setLevel] = useState('Beginner');
  const [error, setError] = useState('');
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
    setDate('');
    setTime('');
    setPrice('');
    setMaxPlayers('4');
    setLevel('Beginner');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const eventData = {
        title,
        location,
        date,
        time,
        price: Number(price),
        maxPlayers: Number(maxPlayers),
        currentPlayers: 1,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        players: [user.uid],
        level
      };

      const docRef = await addDoc(collection(db, 'events'), eventData);
      setEventId(docRef.id);
      setShowSuccess(true);
      resetForm();
    } catch (err) {
      setError('Failed to create event');
      console.error('Error creating event:', err);
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

  return open ? (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div ref={dialogRef} className="bg-[#1E1E1E] rounded-3xl p-8 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">Create new event</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Event title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
              required
            />
          </div>

          <div>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
              required
            >
              <option value="">Event location</option>
              {PADEL_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="number"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
              required
            />
          </div>

          <div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
              required
            />
          </div>

          <div>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
              required
            />
          </div>

          <div>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
              required
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div>
            <select
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
              className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
              required
            >
              <option value="4">4 players</option>
              <option value="3">3 players</option>
              <option value="2">2 players</option>
            </select>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-transparent border border-[#C1FF2F] text-[#C1FF2F] rounded-xl py-3 hover:bg-[#C1FF2F] hover:text-black transition-colors"
          >
            Create new event
          </button>
        </form>
      </div>
    </div>
  ) : null;
}; 