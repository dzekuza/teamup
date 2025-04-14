import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { EmailVerificationBanner } from './components/EmailVerificationBanner';
import { Home } from './pages/Home';
import Login from './pages/Login';
import { Register } from './pages/Register';
import { VerifyEmail } from './pages/VerifyEmail';
import EventDetails from './pages/EventDetails';
import Profile from './pages/Profile';
import LandingPage from './pages/LandingPage';
import { useAuth } from './hooks/useAuth';
import Preloader from './components/Preloader';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Preloader />;
  }

  return (
    <div className="min-h-screen bg-[#111111]">
      <Router>
        {user && (
          <>
            <EmailVerificationBanner />
            <Navbar />
          </>
        )}
        <Routes>
          <Route path="/" element={user ? <Home /> : <LandingPage />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/event/:id" element={user ? <EventDetails /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
