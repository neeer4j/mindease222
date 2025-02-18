import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, isAdmin, isInAdminMode, isAuthenticated } = useAuth();

  // First check authentication
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Then check admin status and mode
  if (!isAdmin || !isInAdminMode) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;