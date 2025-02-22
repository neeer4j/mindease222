// src/components/ProtectedRoute.js

import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';
import BannedUserScreen from './BannedUserScreen';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, isBanned } = useContext(AuthContext);

  if (loading) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isBanned) {
    return <BannedUserScreen />;
  }

  return children;
};

export default ProtectedRoute;
