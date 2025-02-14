const WebSocket = require('ws');

// Specify the server IP and port
// const serverIP = '192.168.3.144';
const serverIP = '192.168.3.27';

const serverPort = 8701;

// Create a WebSocket Server
const wss = new WebSocket.Server({ host: serverIP, port: serverPort });

wss.on('connection', function connection(ws) {
  // console.log('A new client connected!');

  // Handle incoming messages from clients
  ws.on('message', function incoming(message) {
    // console.log('received: %s', message);
    parsedData = JSON.parse(message);
    const battery = parsedData.battery;
    // console.log('Position:', position);
    console.log('Battery', battery.percent);

    // console.log('X:', position.x);
    // console.log('Y:', position.y);
    // console.log('Z:', position.z);

    // Echo the message back to the client
    // ws.send(`Server received: ${message}`);
  });

  // Send a welcome message to every new client
  ws.send('Welcome to the WebSocket server!');

  // Handle client disconnect
  ws.on('close', () => {
    // console.log('Client has disconnected.');
  });

  // Handle any errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

console.log(`WebSocket server is running on ws://${serverIP}:${serverPort}`);
