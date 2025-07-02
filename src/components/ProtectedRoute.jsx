import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireRole = null }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requireRole && user.role !== requireRole) {
    return <Navigate to="/dashboard" />;
  }

  // Redirect superadmin to their dashboard
  if (user.role === 'superadmin') {
    return <Navigate to="/super-admin" />;
  }

  return children;
};

export default ProtectedRoute;