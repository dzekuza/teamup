import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';
import { toast } from 'react-hot-toast';

// Read credentials from environment variables
const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD;

const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    // Check if environment variables are set
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        setError('Admin credentials are not configured.');
        toast.error('Admin login is not properly configured. Contact site administrator.');
        console.error("Admin environment variables REACT_APP_ADMIN_EMAIL or REACT_APP_ADMIN_PASSWORD are not set.");
        return;
    }

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Store login state in sessionStorage (cleared when browser tab closes)
      sessionStorage.setItem('isAdminLoggedIn', 'true');
      toast.success('Admin login successful');
      navigate('/admin/dashboard'); // Redirect to the dashboard
    } else {
      setError('Invalid email or password');
      toast.error('Invalid email or password');
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="80vh" // Adjust height as needed
      bgcolor="#121212" // Match background
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#1E1E1E',
          color: '#fff'
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Admin Login
        </Typography>
        <form onSubmit={handleLogin}>
          <TextField
            label="Email"
            variant="outlined"
            margin="normal"
            fullWidth
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputLabelProps={{ style: { color: '#aaa' } }}
            InputProps={{ style: { color: '#fff' } }}
            sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#555' } } }}
          />
          <TextField
            label="Password"
            variant="outlined"
            margin="normal"
            fullWidth
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputLabelProps={{ style: { color: '#aaa' } }}
            InputProps={{ style: { color: '#fff' } }}
             sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#555' } } }}
          />
          {error && (
            <Typography color="error" variant="body2" align="center" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 3, mb: 2, backgroundColor: '#C1FF2F', color: '#000', '&:hover': { backgroundColor: '#aee62a' } }}
          >
            Login
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default AdminLoginPage; 