import React from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

// Enhanced ProtectedRoute component with comprehensive authentication handling
const ProtectedRoute = ({ children, requiredRole = null, fallback = null }) => {
  const { user, loading, isAuthenticated, isInitialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  console.log('🔍 ProtectedRoute: Render state:', {
    hasUser: !!user,
    loading,
    isAuthenticated,
    isInitialized,
    requiredRole,
    currentPath: location.pathname
  });

  // Show loading spinner while initializing
  if (!isInitialized || loading) {
    console.log('🔍 ProtectedRoute: Showing loading state');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    console.log('🔍 ProtectedRoute: User not authenticated, redirecting to login');
    navigate('/login', { 
      state: { from: location },
      replace: true 
    });
    return null;
  }

  // Check role requirements if specified
  if (requiredRole) {
    const userRole = user.ruolo?.toLowerCase();
    const requiredRoleLower = requiredRole.toLowerCase();
    
    console.log('🔍 ProtectedRoute: Checking role requirements:', {
      userRole,
      requiredRole: requiredRoleLower,
      hasRequiredRole: userRole === requiredRoleLower || userRole === 'superadmin'
    });

    if (userRole !== requiredRoleLower && userRole !== 'superadmin') {
      console.log('🔍 ProtectedRoute: User lacks required role, redirecting');
      navigate('/unauthorized', { replace: true });
      return null;
    }
  }

  // User is authenticated and has required role (if any)
  console.log('🔍 ProtectedRoute: User authorized, rendering children');
  return children || fallback;
};

// Enhanced AdminRoute component
export const AdminRoute = ({ children }) => {
  return (
    <ProtectedRoute requiredRole="admin">
      {children}
    </ProtectedRoute>
  );
};

// Enhanced SuperAdminRoute component
export const SuperAdminRoute = ({ children }) => {
  return (
    <ProtectedRoute requiredRole="superadmin">
      {children}
    </ProtectedRoute>
  );
};

// Enhanced SubadminRoute component
export const SubadminRoute = ({ children }) => {
  return (
    <ProtectedRoute requiredRole="subadmin">
      {children}
    </ProtectedRoute>
  );
};

export default ProtectedRoute; 