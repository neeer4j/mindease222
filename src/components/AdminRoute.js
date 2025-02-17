import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, isAdmin, isInAdminMode } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin || !isInAdminMode) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default AdminRoute;