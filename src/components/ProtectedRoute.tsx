import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingScreen from './LoadingScreen';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  adminOnly = false 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly) {
    // Check if user is admin - you would need to implement this logic
    // based on your app's way of storing user roles
    const isAdmin = user.email?.endsWith('@admin.com') || false;
    if (!isAdmin) {
      return <Navigate to="/" />;
    }
  }

  // If authenticated (and admin if required), render the children
  return <>{children}</>;
};

export default ProtectedRoute; 