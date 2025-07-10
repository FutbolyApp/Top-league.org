import WebSocketClient from './WebSocketClient';

let socketClient = null;
let isInitialized = false;

// Initialize WebSocket connection
export const initSocket = (url = 'ws://localhost:3001/ws') => {
  if (isInitialized) {
    return socketClient;
  }

  try {
    socketClient = new WebSocketClient(url, {
      maxReconnectAttempts: 3,
      reconnectInterval: 5000
    });

    socketClient.on('connected', () => {
      console.log('WebSocket connected successfully');
    });

    socketClient.on('disconnected', (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
    });

    socketClient.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    socketClient.on('message', (data) => {
      console.log('WebSocket message received:', data);
      // Handle different message types
      if (data.type === 'notification') {
        // Handle notification updates
        window.dispatchEvent(new CustomEvent('notification-update', { detail: data }));
      }
    });

    // Attempt to connect
    socketClient.connect();
    isInitialized = true;

  } catch (error) {
    console.error('Failed to initialize WebSocket:', error);
  }

  return socketClient;
};

// Get the current socket client
export const getSocket = () => {
  if (!socketClient) {
    return initSocket();
  }
  return socketClient;
};

// Send a message through WebSocket
export const sendMessage = (type, data) => {
  const socket = getSocket();
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send({ type, data });
  } else {
    console.warn('WebSocket not connected, message not sent:', { type, data });
  }
};

// Disconnect WebSocket
export const disconnectSocket = () => {
  if (socketClient) {
    socketClient.disconnect();
    socketClient = null;
    isInitialized = false;
  }
};

// Check if WebSocket is connected
export const isSocketConnected = () => {
  return socketClient && socketClient.readyState === WebSocket.OPEN;
};

// Initialize socket when the module is imported
if (typeof window !== 'undefined') {
  // Only initialize in browser environment
  setTimeout(() => {
    initSocket();
  }, 1000); // Delay initialization to avoid blocking page load
} 