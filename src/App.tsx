import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { MobileNavigation } from './components/MobileNavigation';
import { EmailVerificationBanner } from './components/EmailVerificationBanner';
import CookieConsentBanner from './components/CookieConsentBanner';
import { Home } from './pages/Home';
import Login from './pages/Login';
import { Register } from './pages/Register';
import { VerifyEmail } from './pages/VerifyEmail';
import EventDetails from './pages/EventDetails';
import SingleLocation from './pages/SingleLocation';
import LandingPage from './pages/LandingPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Preloader from './components/Preloader';
import { SavedEvents } from './pages/SavedEvents';
import { Community } from './pages/Community';
import Locations from './pages/Locations';
import { useCookieContext } from './contexts/CookieContext';
import { AccessProvider, useAccess } from './contexts/AccessContext';
import AccessCodePage from './pages/AccessCodePage';

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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (authLoading) {
    return <Preloader />;
  }

  if (!isAccessGranted) {
    return <AccessCodePage />;
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col">
      {!isMobile && <Navbar />}
      <main className="flex-grow container mx-auto pt-4 pb-8 sm:pt-4 sm:pb-8">
        <Routes>
          <Route path="/" element={user ? <Home /> : <LandingPage />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/event/:id" element={user ? <EventDetails /> : <Navigate to="/login" />} />
          <Route path="/my-events" element={user ? <Home myEventsOnly={true} /> : <Navigate to="/login" />} />
          <Route path="/notifications" element={user ? <Home notificationsOnly={true} /> : <Navigate to="/login" />} />
          <Route path="/community" element={user ? <Community /> : <Navigate to="/login" />} />
          <Route path="/saved-events" element={user ? <SavedEvents /> : <Navigate to="/login" />} />
          <Route path="/locations" element={user ? <Locations /> : <Navigate to="/login" />} />
          <Route path="/location/:locationId" element={user ? <SingleLocation /> : <Navigate to="/login" />} />
        </Routes>
      </main>
      {user && (
        <>
          <EmailVerificationBanner />
        </>
      )}
      {user && isMobile && <MobileNavigation />}
      
      {(!preferences || !preferences.cookieConsent) && <CookieConsentBanner />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AccessProvider>
        <Router>
          <AppContent />
        </Router>
      </AccessProvider>
    </AuthProvider>
  );
};

export default App;
