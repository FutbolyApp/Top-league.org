import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const SuperAdminRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.ruolo !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default SuperAdminRoute; 