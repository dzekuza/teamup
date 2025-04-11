import React, { useEffect, useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, MenuItem } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { Event } from '../types';

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

const EditEvent = () => {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [level, setLevel] = useState<Event['level']>('Beginner');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id || !user) return;
      try {
        const eventDoc = await getDoc(doc(db, 'events', id));
        if (eventDoc.exists()) {
          const eventData = eventDoc.data() as Event;
          if (eventData.createdBy !== user.id) {
            navigate('/');
            return;
          }
          setTitle(eventData.title);
          setLocation(eventData.location);
          setLevel(eventData.level);
          setPrice(eventData.price.toString());
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        setError('Failed to fetch event details.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;

    try {
      const eventRef = doc(db, 'events', id);
      await updateDoc(eventRef, {
        title,
        location,
        level,
        price: Number(price),
      });
      navigate(`/event/${id}`);
    } catch (error) {
      setError('Failed to update event.');
    }
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Edit Event
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
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
              >
                Update Event
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                fullWidth
                onClick={() => navigate(`/event/${id}`)}
              >
                Cancel
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default EditEvent; 