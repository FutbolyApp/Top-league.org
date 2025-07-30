
import React, { useEffect } from 'react';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';

// Component to handle router errors and URL cleanup
const RouterErrorHandler = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('🔍 SafeRouter: Current location:', location.pathname);
    console.log('🔍 SafeRouter: Search params:', location.search);
    console.log('🔍 SafeRouter: Hash:', location.hash);

    try {
      // Handle malformed URLs that might cause router errors
      const currentUrl = window.location.href;
      const currentPath = window.location.pathname;
      const currentSearch = window.location.search;

      // Check for problematic URL patterns
      if (currentPath.includes('?/') || currentSearch.includes('?/')) {
        console.log('🔍 SafeRouter: Detected problematic URL pattern');
        
        // Clean the URL
        let cleanPath = currentPath.replace(/\?\//g, '/');
        let cleanSearch = currentSearch.replace(/\?\//g, '');
        
        // Remove double slashes
        cleanPath = cleanPath.replace(/\/+/g, '/');
        
        const cleanUrl = cleanPath + cleanSearch + window.location.hash;
        console.log('🔍 SafeRouter: Redirecting to clean URL:', cleanUrl);
        
        // Use window.location.replace to avoid adding to history
        window.location.replace(cleanUrl);
        return;
      }

      // Check for other problematic patterns
      if (currentPath.includes('~and~')) {
        console.log('🔍 SafeRouter: Detected encoded URL pattern');
        const cleanPath = currentPath.replace(/~and~/g, '&');
        const cleanUrl = cleanPath + currentSearch + window.location.hash;
        console.log('🔍 SafeRouter: Redirecting to decoded URL:', cleanUrl);
        window.location.replace(cleanUrl);
        return;
      }

    } catch (error) {
      console.error('🚨 SafeRouter: Error in URL cleanup:', error);
      
      // If we're not on the home page and there's an error, go to home
      if (location.pathname !== '/' && location.pathname !== '/login') {
        console.log('🔍 SafeRouter: Redirecting to home due to error');
        try {
          navigate('/', { replace: true });
        } catch (navError) {
          console.error('🚨 SafeRouter: Navigation error, using window.location');
          window.location.replace('/');
        }
      }
    }
  }, [location, navigate]);

  return children;
};

// Safe Router wrapper that catches router-related errors
const SafeRouter = ({ children }) => {
  const routerProps = {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  };

  return (
    <BrowserRouter {...routerProps}>
      <RouterErrorHandler>
        {children}
      </RouterErrorHandler>
    </BrowserRouter>
  );
};

export default SafeRouter;