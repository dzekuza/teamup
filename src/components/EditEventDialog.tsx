import { FC, useState, useEffect, useRef } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { Event } from '../types';
import { useClickOutside } from '../hooks/useClickOutside';

const PADEL_LOCATIONS = [
  'Padel Vilnius - Liepkalnio g. 2C, Vilnius 02105',
  'Ozo Padel & Tennis - Ozo g. 14C, Vilnius 08200',
  'SET Padel Club - Kareivių g. 14, Vilnius 09117',
  'Tennis Pro Academy Padel - Naugarduko g. 76, Vilnius 03202',
  'GO9 Padel - Gedimino pr. 9, Vilnius 01103',
  'Padel House Vilnius - Žygio g. 97A, Vilnius 08234',
  'LTU Padel Club - Viršuliškių g. 40, Vilnius 05131'
];

interface EditEventDialogProps {
  open: boolean;
  onClose: () => void;
  onEventUpdated: () => void;
  eventId: string;
}

export const EditEventDialog: FC<EditEventDialogProps> = ({ open, onClose, onEventUpdated, eventId }) => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [price, setPrice] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('4');
  const [level, setLevel] = useState('Beginner');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const dialogRef = useRef<HTMLDivElement>(null);

  useClickOutside(dialogRef, onClose);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId || !user) return;
      try {
        const eventDoc = await getDoc(doc(db, 'events', eventId));
        if (eventDoc.exists()) {
          const eventData = eventDoc.data() as Event;
          if (eventData.createdBy !== user.uid) {
            onClose();
            return;
          }
          setTitle(eventData.title);
          setLocation(eventData.location);
          setDate(eventData.date);
          setTime(eventData.time);
          setLevel(eventData.level);
          setPrice(eventData.price.toString());
          setMaxPlayers(eventData.maxPlayers.toString());
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        setError('Failed to fetch event details.');
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchEvent();
    }
  }, [eventId, user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !user) return;

    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        title,
        location,
        date,
        time,
        level,
        price: Number(price),
        maxPlayers: Number(maxPlayers)
      });
      onEventUpdated();
      onClose();
    } catch (error) {
      setError('Failed to update event.');
      console.error('Error updating event:', error);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div ref={dialogRef} className="bg-[#1E1E1E] rounded-3xl p-8 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">Edit event</h2>
        
        {loading ? (
          <div className="text-white text-center">Loading...</div>
        ) : (
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
              Update event
            </button>
          </form>
        )}
      </div>
    </div>
  );
}; 