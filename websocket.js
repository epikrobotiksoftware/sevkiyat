const WebSocket = require('ws');

function connectWebSocket() {
  // Create WebSocket connection.
  const ws = new WebSocket('ws://192.168.3.28:8701');

  // Connection opened
  ws.on('open', function open() {
    console.log('Connected to the server');
    // You can also send messages to the server if needed
    // ws.send('Hello Server!');
  });

  // Listen for messages
  ws.on('message', function incoming(data) {
    console.log('Received:', data);
  });

  // Handle errors
  ws.on('error', function error(err) {
    console.error('WebSocket error:', err);
  });

  // Handle connection closed
  ws.on('close', function close() {
    console.log('Connection closed, attempting to reconnect...');
    setTimeout(connectWebSocket, 5000); // Try to reconnect every 5 seconds
  });
}

// Connect to WebSocket Server
connectWebSocket();

// // module.exports = connectWebSocket;
