import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from 'styled-components';
import RouterWrapper from './components/RouterWrapper';
import App from './App';
import './index.css';

const theme = {
  colors: {
    primary: '#FFA94D',
    background: '#ffffff',
    text: '#333333',
  },
  borderRadius: '16px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <RouterWrapper>
        <App />
      </RouterWrapper>
    </ThemeProvider>
  </React.StrictMode>
);
