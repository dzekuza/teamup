import { FC, useState, useEffect, useRef } from 'react';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { Event } from '../types/index';
import { useClickOutside } from '../hooks/useClickOutside';
import { PADEL_LOCATIONS, Location } from '../constants/locations';
import { sendEventInvitation } from '../services/emailService';
import { createNotification } from '../services/notificationService';
import { FriendSearch } from './FriendSearch';

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
  const [endTime, setEndTime] = useState('');
  const [price, setPrice] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('4');
  const [level, setLevel] = useState('Beginner');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const { user, userFriends } = useAuth();
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
          setDate(eventData.date.split('T')[0]);
          setTime(eventData.time);
          setEndTime(eventData.endTime);
          setLevel(eventData.level);
          setPrice(eventData.price.toString());
          setMaxPlayers(eventData.maxPlayers.toString());
          setIsPrivate(eventData.isPrivate || false);
          setPassword(eventData.password || '');
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        setError('Failed to fetch event details.');
      } finally {
        setLoading(false);
      }
    };

    if (open && eventId) {
      fetchEvent();
    }
  }, [open, eventId, onClose, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        title,
        location,
        date: new Date(date).toISOString(),
        time,
        endTime,
        level,
        price: parseFloat(price),
        maxPlayers: parseInt(maxPlayers),
        isPrivate,
        ...(isPrivate && { password }),
      });

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
                eventId,
                eventTitle: title,
                createdBy: user!.uid,
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
                  `${time} - ${endTime}`,
                  location,
                  user!.displayName || user!.email || 'A friend'
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
              title,
              date,
              `${time} - ${endTime}`,
              location,
              user!.displayName || user!.email || 'A friend'
            );
          }
        } catch (error) {
          console.error('Error sending email invitations:', error);
        }
      }

      if (onEventUpdated) {
        onEventUpdated();
      }
      onClose();
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleDelete = async () => {
    if (!eventId || !user) return;

    try {
      await deleteDoc(doc(db, 'events', eventId));
      onEventUpdated();
      onClose();
    } catch (error) {
      setError('Failed to delete event.');
      console.error('Error deleting event:', error);
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

  if (!open) return null;

  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
        <div ref={dialogRef} className="bg-[#1E1E1E] rounded-3xl p-8 w-full max-w-md relative">
          <h2 className="text-2xl font-bold text-white mb-6">Delete Event</h2>
          <p className="text-white mb-6">Are you sure you want to delete this event? This action cannot be undone.</p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 text-sm font-medium text-white bg-[#2A2A2A] rounded-xl hover:bg-[#3A3A3A] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
            >
              Delete Event
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div ref={dialogRef} className="bg-[#1E1E1E] rounded-3xl p-8 w-full max-w-md relative overflow-y-auto max-h-[90vh]">
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Event Title</label>
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
              <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                required
              >
                <option value="">Select location</option>
                {PADEL_LOCATIONS.map((loc) => (
                  <option key={loc.name} value={loc.name}>{loc.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Start Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Price (€)</label>
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
              <label className="block text-sm font-medium text-gray-400 mb-2">Level</label>
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
              <label className="block text-sm font-medium text-gray-400 mb-2">Maximum Players</label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
                className="w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                required
              >
                <option value="4">4 players</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Event Privacy</label>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="public"
                    name="privacy"
                    checked={!isPrivate}
                    onChange={() => setIsPrivate(false)}
                    className="mr-2"
                  />
                  <label htmlFor="public" className="text-white">Public Event</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="private"
                    name="privacy"
                    checked={isPrivate}
                    onChange={() => setIsPrivate(true)}
                    className="mr-2"
                  />
                  <label htmlFor="private" className="text-white">Private Event</label>
                </div>
                {isPrivate && (
                  <div>
                    <label className="block text-white mb-2">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#2A2A2A] text-white rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F]"
                      placeholder="Enter password for private event"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Invite More Friends</h3>
              
              <FriendSearch
                userFriends={userFriends || []}
                selectedFriends={selectedFriends}
                onToggleFriend={handleToggleFriend}
              />

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
                    type="button"
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
                          type="button"
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
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <div className="flex justify-between items-center space-x-4">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete Event
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-black bg-[#C1FF2F] rounded-xl hover:bg-[#B1EF1F] transition-colors"
              >
                Update event
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}; 