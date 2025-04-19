import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Paper, List, ListItem, ListItemText, IconButton, CircularProgress, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase';
import { Event } from '../../types'; // Assuming your Event type is here
import { toast } from 'react-hot-toast';

const EventManagement: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const eventsQuery = query(collection(db, 'events'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(eventsQuery);
      const eventsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
      setEvents(eventsList);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to fetch events.");
      toast.error("Failed to fetch events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDeleteClick = (event: Event) => {
    setEventToDelete(event);
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setEventToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'events', eventToDelete.id));
      toast.success(`Event "${eventToDelete.title}" deleted successfully.`);
      fetchEvents();
    } catch (err) {
      console.error("Error deleting event:", err);
      toast.error(`Failed to delete event "${eventToDelete.title}".`);
      setError(`Failed to delete event "${eventToDelete.title}".`);
    } finally {
      setIsDeleting(false);
      handleCloseConfirmDialog();
    }
  };

  const filteredEvents = useMemo(() => {
    if (!searchTerm) {
      return events;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return events.filter(event =>
      (event.title?.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (event.location?.toLowerCase().includes(lowerCaseSearchTerm))
    );
  }, [events, searchTerm]);

  return (
    <Paper sx={{ p: 3, backgroundColor: '#1E1E1E', color: '#fff' }}>
      <Typography variant="h5" gutterBottom>
        Event Management
      </Typography>

      <TextField
        label="Search Events (Title or Location)"
        variant="outlined"
        fullWidth
        margin="normal"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputLabelProps={{ style: { color: '#aaa' } }}
        InputProps={{ style: { color: '#fff', backgroundColor: '#333' } }}
        sx={{ mb: 2, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#555' } } }}
      />

      {loading && (
        <Box display="flex" justifyContent="center" my={3}>
          <CircularProgress color="inherit" />
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ my: 2 }}>
          {error}
        </Typography>
      )}

      {!loading && !error && (
        <List sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <ListItem
                key={event.id}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDeleteClick(event)}
                    sx={{ color: '#ff6b6b' }}
                    disabled={isDeleting && eventToDelete?.id === event.id}
                  >
                    {isDeleting && eventToDelete?.id === event.id ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
                  </IconButton>
                }
                sx={{ borderBottom: '1px solid #333' }}
              >
                <ListItemText
                  primary={event.title}
                  secondary={`${event.date} at ${event.time} - ${event.location} (${event.status})`}
                  primaryTypographyProps={{ color: '#fff' }}
                  secondaryTypographyProps={{ color: '#aaa' }}
                />
              </ListItem>
            ))
          ) : (
            <Typography sx={{ textAlign: 'center', mt: 3, color: '#aaa' }}>
              No events found matching "{searchTerm}".
            </Typography>
          )}
        </List>
      )}

      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
        PaperProps={{ sx: { backgroundColor: '#1E1E1E', color: '#fff' } }}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#ccc' }}>
            Are you sure you want to permanently delete the event "{eventToDelete?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} sx={{ color: '#aaa' }} disabled={isDeleting}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} sx={{ color: '#ff6b6b' }} disabled={isDeleting}>
            {isDeleting ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default EventManagement; 