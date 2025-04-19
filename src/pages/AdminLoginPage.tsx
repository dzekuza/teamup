import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';
import { toast } from 'react-hot-toast';
// Remove Firebase Auth imports
// import { signInWithEmailAndPassword } from 'firebase/auth';
// import { auth } from '../firebase';

// Define the hardcoded credentials
const ADMIN_EMAIL = 'info@gvozdovic.com';
const ADMIN_PASSWORD = 'letsteamupadmin12';

const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Keep loading state for feedback
  const navigate = useNavigate();

  const handleLogin = (event: React.FormEvent) => { // No longer needs to be async
    event.preventDefault();
    setError('');
    setIsLoading(true); // Set loading true for immediate feedback

    // Simulate a short delay for UX
    setTimeout(() => {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // Store simple login state in sessionStorage
        // Note: This is just for this page's logic; secure route protection
        // should still rely on the Firestore check in AdminProtectedRoute
        sessionStorage.setItem('isAdminLoggedIn', 'true');
        toast.success('Admin login successful');
        navigate('/admin/dashboard'); // Redirect to the dashboard
      } else {
        setError('Invalid email or password');
        toast.error('Invalid email or password');
      }
      setIsLoading(false); // Set loading false after check
    }, 500); // 500ms delay

    /* Remove Firebase Auth logic
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Login successful');
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error("Admin login error:", err);
      let errorMessage = 'Invalid email or password.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else {
        errorMessage = 'An unexpected error occurred during login.';
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
    */
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
            disabled={isLoading} // Disable button when loading
            sx={{ mt: 3, mb: 2, backgroundColor: '#C1FF2F', color: '#000', '&:hover': { backgroundColor: '#aee62a' } }}
          >
            {isLoading ? 'Logging in...' : 'Login'} {/* Show loading text */}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default AdminLoginPage; 