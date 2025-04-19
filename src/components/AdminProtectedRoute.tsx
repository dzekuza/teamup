import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CircularProgress, Box } from '@mui/material'; // For loading state

interface UserData {
  isAdmin?: boolean;
  // Add other user fields if needed
}

export const AdminProtectedRoute: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (authLoading) {
        // Still waiting for authentication status
        return;
      }
      if (!user) {
        // Not logged in
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // User is logged in, check their Firestore document
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as UserData;
          setIsAdmin(userData.isAdmin === true); // Explicitly check for true
        } else {
          // User document doesn't exist, cannot be admin
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false); // Assume not admin on error
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, authLoading]);

  if (loading || authLoading) {
    // Show loading indicator while checking auth/admin status
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
}; 