import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { MobileNavigation } from './components/MobileNavigation';
import { EmailVerificationBanner } from './components/EmailVerificationBanner';
import CookieConsentBanner from './components/CookieConsentBanner';
import Footer from './components/Footer';
import { Home } from './pages/Home';
import Login from './pages/Login';
import { Register } from './pages/Register';
import { VerifyEmail } from './pages/VerifyEmail';
import EventDetails from './pages/EventDetails';
import LandingPage from './pages/LandingPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Preloader from './components/Preloader';
import { SavedEvents } from './pages/SavedEvents';
import { Community } from './pages/Community';
import PrivacyPolicy from './pages/PrivacyPolicy';
import { useCookieContext } from './contexts/CookieContext';
import { AccessProvider, useAccess } from './contexts/AccessContext';
import AccessCodePage from './pages/AccessCodePage';
import {
  CircularProgress,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import { toast } from 'react-hot-toast';
import AdminDashboardWrapper from './components/AdminDashboardWrapper';
import AdminLoginPage from './pages/AdminLoginPage';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Lazy load components
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AnalyticsDashboard = lazy(() => import('./components/admin/AnalyticsDashboard'));
const UserManagement = lazy(() => import('./components/admin/UserManagement'));
const EventManagement = lazy(() => import('./components/admin/EventManagement'));
const LocationsPage = lazy(() => import('./pages/Locations'));
const SingleLocationPage = lazy(() => import('./pages/SingleLocation'));
const Messages = lazy(() => import('./pages/Messages'));
const Profile = lazy(() => import('./pages/Profile'));

// Add global styles for mobile navigation padding
const mobileNavStyles = `
  @media (max-width: 768px) {
    body {
      padding-bottom: env(safe-area-inset-bottom, 84px);
    }
    .fixed-bottom-navigation {
      padding-bottom: env(safe-area-inset-bottom, 20px);
    }
  }
`;

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { preferences } = useCookieContext();
  const { isAccessGranted } = useAccess();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // State for feedback dialog
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handlers for feedback dialog
  const handleOpenFeedbackDialog = () => {
    setFeedbackDialogOpen(true);
  };

  const handleCloseFeedbackDialog = () => {
    setFeedbackDialogOpen(false);
    // Reset form on close
    setFeedbackType('');
    setFeedbackMessage('');
    setError(''); // Clear any previous errors
  };

  const [error, setError] = useState(''); // Feedback form error state

  const handleSendFeedback = async () => {
      setError('');
      if (!feedbackType) {
          setError('Please select a feedback type.');
          return;
      }
      if (!feedbackMessage.trim()) {
          setError('Please enter your feedback message.');
          return;
      }

      setIsSendingFeedback(true);

      // Get Firebase Functions instance
      const functions = getFunctions();
      // Get reference to the callable function
      // NOTE: Use 'sendFeedbackEmail' (the name exported in index.js)
      const sendFeedback = httpsCallable(functions, 'sendFeedbackEmail');

      try {
          // Call the function with the data
          const result = await sendFeedback({
              feedbackType: feedbackType,
              feedbackMessage: feedbackMessage,
              userId: user?.uid,       // Pass user ID if available
              userEmail: user?.email    // Pass user email if available
          });

          // Check result from function (optional, based on function return)
          if ((result.data as any)?.success) {
              toast.success('Feedback sent successfully! Thank you.');
              handleCloseFeedbackDialog(); // Close dialog on success
          } else {
              throw new Error('Function call did not indicate success');
          }
      } catch (err) {
          console.error("Error sending feedback:", err);
          toast.error('Failed to send feedback. Please try again later.');
          setError('Failed to send feedback. Please try again.');
      } finally {
          setIsSendingFeedback(false);
      }
  };

  if (authLoading) {
    return <Preloader />;
  }

  if (!isAccessGranted) {
    return <AccessCodePage />;
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col relative">
      {!isMobile && window.location.pathname !== '/app' && <Navbar />}
      <main className={`flex-grow container mx-auto ${window.location.pathname !== '/app' ? 'pt-4 pb-8 sm:pt-4 sm:pb-8' : ''}`}>
        <Suspense fallback={
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
            <CircularProgress sx={{ color: '#C1FF2F' }} />
          </Box>
        }>
          <Routes>
            <Route path="/" element={user ? <Home /> : <Navigate to="/app" />} />
            <Route path="/app" element={<LandingPage />} />
            <Route path="/join" element={<LandingPage />} />
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/event/:id" element={user ? <EventDetails /> : <Navigate to="/login" />} />
            <Route path="/my-events" element={user ? <Home myEventsOnly={true} /> : <Navigate to="/login" />} />
            <Route path="/notifications" element={user ? <Home notificationsOnly={true} /> : <Navigate to="/login" />} />
            <Route path="/community" element={user ? <Community /> : <Navigate to="/login" />} />
            <Route path="/saved-events" element={user ? <SavedEvents /> : <Navigate to="/login" />} />
            <Route path="/locations" element={<LocationsPage />} />
            <Route path="/location/:locationId" element={<SingleLocationPage />} />
            <Route path="/messages" element={user ? <Messages /> : <Navigate to="/login" />} />
            <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />

            {/* --- Admin Routes --- */}
            {/* Login Page Route */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Protected Dashboard Route */}
            <Route path="/admin/dashboard" element={<AdminDashboardWrapper />}>
                {/* Admin Page Layout Route - renders layout and provides Outlet */}
                <Route element={<AdminPage />}>
                    <Route index element={<Navigate to="analytics" replace />} />
                    <Route path="analytics" element={<AnalyticsDashboard />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="events" element={<EventManagement />} />
                </Route>
            </Route>
            {/* --- End Admin Routes --- */}

            {/* Optional: Add a catch-all 404 route if desired */}
            {/* <Route path="*" element={<NotFoundPage />} /> */}
          </Routes>
        </Suspense>
      </main>

      {window.location.pathname !== '/app' && <Footer />}

      {user && (
        <>
          <EmailVerificationBanner />
        </>
      )}
      {isMobile && window.location.pathname !== '/app' && <MobileNavigation />}
      
      {(!preferences || !preferences.cookieConsent) && <CookieConsentBanner />}

      {/* Feedback Icon - Positioned Fixed */}
      <IconButton
        onClick={handleOpenFeedbackDialog}
        sx={{
          position: 'fixed',
          bottom: isMobile ? '100px' : '20px', // Adjust position based on mobile nav
          right: '20px',
          backgroundColor: '#C1FF2F', // Accent color
          color: '#000', // Black icon color
          zIndex: 40, // Lowered z-index to be below pop-ups (like z-50)
          '&:hover': {
            backgroundColor: '#aee62a', // Slightly darker on hover
          },
        }}
        aria-label="Send Feedback"
      >
        <InfoIcon />
      </IconButton>

      {/* Feedback Dialog */}
      <Dialog
          open={feedbackDialogOpen}
          onClose={handleCloseFeedbackDialog}
          PaperProps={{
              sx: {
                  backgroundColor: '#1E1E1E', // Dark background
                  color: '#fff', // White text
                  borderRadius: '12px',
              },
          }}
      >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
              Send Feedback
              <IconButton onClick={handleCloseFeedbackDialog} sx={{ color: '#aaa' }}>
                  <CloseIcon />
              </IconButton>
          </DialogTitle>
          <DialogContent>
              <FormControl component="fieldset" sx={{ mb: 2, mt: 1 }}>
                  <FormLabel component="legend" sx={{ color: '#aaa', mb: 1 }}>Feedback Type*</FormLabel>
                  <RadioGroup
                      row
                      aria-label="feedback-type"
                      name="feedback-type"
                      value={feedbackType}
                      onChange={(e) => setFeedbackType(e.target.value)}
                  >
                      <FormControlLabel value="Bug" control={<Radio sx={{color: '#aaa', '&.Mui-checked': {color: '#C1FF2F'}}}/>} label="Bug Report" />
                      <FormControlLabel value="Improvement" control={<Radio sx={{color: '#aaa', '&.Mui-checked': {color: '#C1FF2F'}}}/>} label="Improvement" />
                      <FormControlLabel value="Other" control={<Radio sx={{color: '#aaa', '&.Mui-checked': {color: '#C1FF2F'}}}/>} label="Other" />
                  </RadioGroup>
              </FormControl>

              <TextField
                  autoFocus
                  margin="dense"
                  id="feedback-message"
                  label="Your Message*"
                  type="text"
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  required
                  InputLabelProps={{ style: { color: '#aaa' } }}
                  InputProps={{ style: { color: '#fff' } }}
                  sx={{
                      '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: '#555' },
                          '&:hover fieldset': { borderColor: '#777' },
                          '&.Mui-focused fieldset': { borderColor: '#C1FF2F' },
                      },
                  }}
              />
              {error && <p style={{ color: '#f44336', fontSize: '0.75rem', marginTop: '8px' }}>{error}</p>}
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px' }}>
              <Button
                onClick={handleCloseFeedbackDialog}
                sx={{ color: '#aaa' }}
                disabled={isSendingFeedback}
              >
                Cancel
              </Button>
              <Button
                  onClick={handleSendFeedback}
                  variant="contained"
                  disabled={isSendingFeedback}
                  sx={{
                      backgroundColor: '#C1FF2F',
                      color: '#000',
                      '&:hover': { backgroundColor: '#aee62a' },
                      '&.Mui-disabled': { backgroundColor: '#555', color: '#888'}
                  }}
              >
                  {isSendingFeedback ? <CircularProgress size={24} sx={{color: '#000'}} /> : 'Send Feedback'}
              </Button>
          </DialogActions>
      </Dialog>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AccessProvider>
        <Router>
          {/* Inject global styles */}
          <style>{mobileNavStyles}</style>
          <AppContent />
        </Router>
      </AccessProvider>
    </AuthProvider>
  );
};

export default App;
