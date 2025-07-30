import React from 'react';
import { BrowserRouter } from 'react-router-dom';

const RouterWrapper = ({ children }) => {
  // Prevent router errors by cleaning URL before router initialization
  React.useEffect(() => {
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    
    // Clean problematic URL patterns before router starts
    if (currentPath.includes('?/') || currentSearch.includes('?/')) {
      const cleanPath = currentPath.replace(/\?\//g, '/');
      const cleanSearch = currentSearch.replace(/\?\//g, '');
      const cleanUrl = cleanPath + cleanSearch + window.location.hash;
      
      console.log('🔧 RouterWrapper: Cleaning URL before router init:', cleanUrl);
      window.history.replaceState(null, '', cleanUrl);
    }
  }, []);

  try {
    return (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    );
  } catch (error) {
    console.error('🚨 RouterWrapper: BrowserRouter failed:', error);
    
    // Fallback: redirect to home
    window.location.href = '/';
    
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f0f0f0'
      }}>
        <div>Redirecting...</div>
      </div>
    );
  }
};

export default RouterWrapper; 