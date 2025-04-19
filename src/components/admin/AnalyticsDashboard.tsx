import React, { useState, useEffect } from 'react';
import { Typography, Paper, Grid, Box, CircularProgress } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import EventIcon from '@mui/icons-material/Event';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-hot-toast';

interface StatCardProps {
  title: string;
  count: number | null;
  icon: React.ReactElement;
  loading: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, count, icon, loading }) => (
  <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', backgroundColor: '#1E1E1E', color: '#fff' }}>
    <Box sx={{ mr: 2, color: '#C1FF2F' }}>{React.cloneElement(icon, { sx: { fontSize: 40 } })}</Box>
    <Box>
      <Typography color="#aaa">{title}</Typography>
      <Typography variant="h4" component="div">
        {loading ? <CircularProgress size={24} color="inherit" /> : count ?? 'N/A'}
      </Typography>
    </Box>
  </Paper>
);

const AnalyticsDashboard: React.FC = () => {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [eventCount, setEventCount] = useState<number | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      setLoadingUsers(true);
      setLoadingEvents(true);
      setError(null);
      let fetchError = false;

      try {
        // Get user count
        const usersCol = collection(db, "users");
        const userSnapshot = await getCountFromServer(usersCol);
        setUserCount(userSnapshot.data().count);
      } catch (err) {
        console.error("Error fetching user count:", err);
        setError(prev => prev ? `${prev}, User count failed` : "User count failed");
        fetchError = true;
      } finally {
         setLoadingUsers(false);
      }

      try {
        // Get event count
        const eventsCol = collection(db, "events");
        const eventSnapshot = await getCountFromServer(eventsCol);
        setEventCount(eventSnapshot.data().count);
      } catch (err) {
        console.error("Error fetching event count:", err);
         setError(prev => prev ? `${prev}, Event count failed` : "Event count failed");
         fetchError = true;
      } finally {
         setLoadingEvents(false);
      }

      if(fetchError){
        toast.error("Failed to fetch some analytics data.");
      }
    };

    fetchCounts();
  }, []);

  const isLoading = loadingUsers || loadingEvents;

  return (
    <Paper sx={{ p: 3, backgroundColor: 'transparent', color: '#fff', boxShadow: 'none' }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Analytics Overview
      </Typography>

      {error && (
        <Typography color="error" sx={{ my: 2 }}>
          Error fetching data: {error}
        </Typography>
      )}

       <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
           <StatCard title="Total Users" count={userCount} icon={<PeopleIcon />} loading={loadingUsers}/>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
           <StatCard title="Total Events" count={eventCount} icon={<EventIcon />} loading={loadingEvents}/>
        </Grid>
        {/* Add more StatCards here as needed */}
      </Grid>

      {/* Optional: Add more sections for detailed analytics later */}
       {/* <Box mt={4}>
         <Typography variant="h6">More Analytics (Coming Soon)</Typography>
       </Box> */}
    </Paper>
  );
};

export default AnalyticsDashboard; 