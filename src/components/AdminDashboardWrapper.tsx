import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

const AdminDashboardWrapper: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    // Check sessionStorage on component mount
    const adminLoggedIn = sessionStorage.getItem('isAdminLoggedIn');
    setIsLoggedIn(adminLoggedIn === 'true');
  }, []);

  if (isLoggedIn === null) {
    // Still checking session storage, show loading
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // If logged in, render the nested Outlet (which will be AdminPage)
  // Otherwise, redirect to the admin login page
  return isLoggedIn ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

export default AdminDashboardWrapper; 