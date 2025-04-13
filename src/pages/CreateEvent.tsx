import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { Event } from '../types/index';

// Predefined padel locations
const PADEL_LOCATIONS = [
  {
    name: 'Padel Vilnius',
    address: 'Liepkalnio g. 2C, Vilnius 02105'
  },
  {
    name: 'Ozo Padel & Tennis',
    address: 'Ozo g. 14C, Vilnius 08200'
  },
  {
    name: 'SET Padel Club',
    address: 'Kareivių g. 14, Vilnius 09117'
  },
  {
    name: 'Tennis Pro Academy Padel',
    address: 'Naugarduko g. 76, Vilnius 03202'
  },
  {
    name: 'GO9 Padel',
    address: 'Gedimino pr. 9, Vilnius 01103'
  },
  {
    name: 'Padel House Vilnius',
    address: 'Žygio g. 97A, Vilnius 08234'
  },
  {
    name: 'LTU Padel Club',
    address: 'Viršuliškių g. 40, Vilnius 05131'
  }
];

const CreateEvent = () => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [level, setLevel] = useState<Event['level']>('Beginner');
  const [price, setPrice] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const eventData: Omit<Event, 'id'> = {
        title,
        location,
        level,
        price: Number(price),
        maxPlayers: Number(maxPlayers),
        createdBy: user.uid,
        date: new Date(date).toISOString(),
        time,
        endTime: new Date(new Date(date).getTime() + 2 * 60 * 60 * 1000).toISOString(), // Default 2 hours duration
        players: [{
          id: user.uid,
          name: user.displayName || user.email || 'Unknown Player',
          photoURL: user.photoURL || undefined
        }],
        status: 'open',
      };

      await addDoc(collection(db, 'events'), eventData);
      navigate('/');
    } catch (error) {
      setError('Failed to create event.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Create Event
          </Typography>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Event Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              select
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              margin="normal"
              required
            >
              {PADEL_LOCATIONS.map((loc) => (
                <MenuItem key={loc.name} value={`${loc.name} - ${loc.address}`}>
                  {loc.name} - {loc.address}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              select
              label="Level"
              value={level}
              onChange={(e) => setLevel(e.target.value as Event['level'])}
              margin="normal"
              required
            >
              <MenuItem value="Beginner">Beginner</MenuItem>
              <MenuItem value="Intermediate">Intermediate</MenuItem>
              <MenuItem value="Advanced">Advanced</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Maximum Players"
              type="number"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              margin="normal"
              required
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 3 }}
            >
              Create Event
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateEvent;