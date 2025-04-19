import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography, Paper, List, ListItem, ListItemText, IconButton, CircularProgress,
  Box, Switch, FormControlLabel, TextField, Tooltip
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { collection, getDocs, doc, updateDoc, Timestamp, query as firestoreQuery, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

// Define a type for user data from Firestore
interface UserProfile {
  id: string;
  displayName?: string;
  email?: string;
  isAdmin?: boolean;
  isBanned?: boolean;
  createdAt?: Timestamp;
}

// Define a type for events needed for counting
interface EventForCount {
    id: string;
    createdBy: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [eventCounts, setEventCounts] = useState<{ [userId: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setLoadingCounts(true);
    setError(null);
    let usersList: UserProfile[] = [];

    try {
      const usersQuery = collection(db, 'users');
      const querySnapshot = await getDocs(usersQuery);
      usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProfile[];
      setUsers(usersList);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users.");
      toast.error("Failed to fetch users.");
      setLoading(false);
      setLoadingCounts(false);
      return;
    } finally {
        setLoading(false);
    }

    try {
      const eventsQuery = collection(db, 'events');
      const eventsSnapshot = await getDocs(eventsQuery);
      const fetchedEvents = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EventForCount[];

      const counts: { [userId: string]: number } = {};
      fetchedEvents.forEach(event => {
        if (event.createdBy) {
          counts[event.createdBy] = (counts[event.createdBy] || 0) + 1;
        }
      });
      setEventCounts(counts);

    } catch (err) {
       console.error("Error fetching event counts:", err);
       toast.error("Failed to fetch event counts.");
    } finally {
        setLoadingCounts(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdminToggle = async (user: UserProfile) => {
    setUpdatingUserId(user.id);
    const newAdminStatus = !user.isAdmin;
    try {
      const userDocRef = doc(db, 'users', user.id);
      await updateDoc(userDocRef, { isAdmin: newAdminStatus });
      toast.success(`${user.displayName || user.email}'s admin status updated.`);
      setUsers(prevUsers => prevUsers.map(u => u.id === user.id ? { ...u, isAdmin: newAdminStatus } : u));
    } catch (err) {
      console.error("Error updating admin status:", err);
      toast.error(`Failed to update admin status for ${user.displayName || user.email}.`);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleBanToggle = async (user: UserProfile) => {
    setUpdatingUserId(user.id);
    const newBanStatus = !user.isBanned;
    const actionText = newBanStatus ? 'banned' : 'unbanned';
    try {
      const userDocRef = doc(db, 'users', user.id);
      await updateDoc(userDocRef, { isBanned: newBanStatus });
      toast.success(`${user.displayName || user.email} has been ${actionText}.`);
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === user.id ? { ...u, isBanned: newBanStatus } : u
        )
      );
    } catch (err) {
      console.error(`Error ${actionText} user:`, err);
      toast.error(`Failed to ${actionText} user ${user.displayName || user.email}.`);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return users.filter(user =>
      (user.displayName?.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (user.email?.toLowerCase().includes(lowerCaseSearchTerm))
    );
  }, [users, searchTerm]);

  const formatDate = (timestamp: Timestamp | undefined): string => {
    if (!timestamp) return 'N/A';
    try {
      return format(timestamp.toDate(), 'PP');
    } catch (e) {
      console.error("Error formatting date:", e);
      return 'Invalid Date';
    }
  };

  const handleMessageUser = (email: string | undefined) => {
      if (!email) {
          toast.error("User does not have an email address.");
          return;
      }
      window.location.href = `mailto:${email}`;
  }

  return (
    <Paper sx={{ p: 3, backgroundColor: '#1E1E1E', color: '#fff' }}>
      <Typography variant="h5" gutterBottom>
        User Management
      </Typography>

      <TextField
        label="Search Users (Name or Email)"
        variant="outlined"
        fullWidth
        margin="normal"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputLabelProps={{ style: { color: '#aaa' } }}
        InputProps={{ style: { color: '#fff', backgroundColor: '#333' } }}
        sx={{ mb: 2, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#555' } } }}
      />

      {loading && <Box display="flex" justifyContent="center" my={3}><CircularProgress color="inherit" /></Box>}
      {error && <Typography color="error" sx={{ my: 2 }}>{error}</Typography>}

      {!loading && !error && (
        <List sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {filteredUsers.length > 0 ? (
             filteredUsers.map((user) => (
              <ListItem
                key={user.id}
                secondaryAction={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                     <Tooltip title="Message User">
                       <span>
                        <IconButton
                          onClick={() => handleMessageUser(user.email)}
                          disabled={updatingUserId === user.id || !user.email}
                          size="small"
                          sx={{ color: '#aaa' }}
                        >
                           {updatingUserId === user.id ? <CircularProgress size={20} color="inherit" /> : <MailOutlineIcon fontSize="small"/>}
                         </IconButton>
                       </span>
                     </Tooltip>
                     <Tooltip title={user.isBanned ? "Unban User" : "Ban User"}>
                       <span>
                        <IconButton
                          onClick={() => handleBanToggle(user)}
                          disabled={updatingUserId === user.id}
                          size="small"
                          sx={{ color: user.isBanned ? '#888' : '#ff6b6b' }}
                        >
                          {updatingUserId === user.id ? <CircularProgress size={20} color="inherit" /> : (user.isBanned ? <CheckCircleOutlineIcon fontSize="small" /> : <BlockIcon fontSize="small"/>)}
                        </IconButton>
                      </span>
                     </Tooltip>
                     <FormControlLabel
                        control={ <Switch checked={user.isAdmin || false}
                        onChange={() => handleAdminToggle(user)}
                        disabled={updatingUserId === user.id}
                        color="primary" size="small" /> }
                        label={updatingUserId === user.id ? <CircularProgress size={20} sx={{ml: 1}} color="inherit" /> : "Admin"}
                        sx={{ mr: 0, ml: 0 }}
                     />
                  </Box>
                 }
                 sx={{
                   borderBottom: '1px solid #333',
                   backgroundColor: user.isBanned ? '#44444450' : 'transparent',
                   opacity: user.isBanned ? 0.7 : 1,
                   pt: 1, pb: 1
                 }}
              >
                 <ListItemText
                  primary={user.displayName || 'No Display Name'}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" sx={{ display: 'block', color: '#aaa', textDecoration: user.isBanned ? 'line-through' : 'none' }}>
                        {user.email || 'No Email'}
                      </Typography>
                      <Typography component="span" variant="caption" sx={{ display: 'block', color: '#888', textDecoration: user.isBanned ? 'line-through' : 'none' }}>
                        Joined: {formatDate(user.createdAt)} | Created Events: {loadingCounts ? <CircularProgress size={10} color="inherit"/> : (eventCounts[user.id] || 0)}
                      </Typography>
                    </>
                  }
                  primaryTypographyProps={{ color: '#fff', style: { textDecoration: user.isBanned ? 'line-through' : 'none', fontSize: '0.95rem' } }}
                 />
                 {user.isAdmin && !user.isBanned && <AdminPanelSettingsIcon sx={{ ml: 2, color: '#C1FF2F' }} />}
                 {user.isBanned && <BlockIcon sx={{ ml: 2, color: '#ff6b6b' }} />}
              </ListItem>
            ))
          ) : (
            <Typography sx={{ textAlign: 'center', mt: 3, color: '#aaa' }}>
              No users found matching "{searchTerm}".
            </Typography>
          )}
        </List>
      )}
    </Paper>
  );
};

export default UserManagement; 