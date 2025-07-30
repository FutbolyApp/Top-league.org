import { WebSocketServer } from 'ws';

let wss = null;

export const initializeWebSocket = (server) => {
  try {
    wss = new WebSocketServer({ server });
    
    wss.on('connection', (ws) => {
      console.log('🔌 WebSocket client connected');
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          console.log('📨 WebSocket message received:', data);
          
          // Echo back for now
          ws.send(JSON.stringify({
            type: 'echo',
            data: data
          }));
        } catch (error) {
          console.error('❌ WebSocket message error:', error);
        }
      });
      
      ws.on('close', () => {
        console.log('🔌 WebSocket client disconnected');
      });
      
      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });
    });
    
    console.log('✅ WebSocket server initialized');
  } catch (error) {
    console.error('❌ Failed to initialize WebSocket:', error);
  }
};

export const broadcastToClients = (message) => {
  if (wss) {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(message));
      }
    });
  }
}; 