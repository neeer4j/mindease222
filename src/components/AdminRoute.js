import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, useMediaQuery } from '@mui/material';

const AdminRoute = ({ children }) => {
  const { user, isAdmin, isInAdminMode, isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // First check authentication
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect admin users on mobile devices to dashboard
  if (isMobile && isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Then check admin status and mode
  if (!isAdmin || !isInAdminMode) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;