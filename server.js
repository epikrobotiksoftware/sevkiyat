// const WebSocket = require('ws');

// // Specify the server IP and port
// // const serverIP = '192.168.3.144';
// const serverIP = '192.168.3.146';

// const serverPort = 8701;

// // Create a WebSocket Server
// const wss = new WebSocket.Server({ host: serverIP, port: serverPort });

// wss.on('connection', function connection(ws) {
//   // console.log('A new client connected!');

//   // Handle incoming messages from clients
//   ws.on('message', function incoming(message) {
//     // console.log('received: %s', message);
//     parsedData = JSON.parse(message);
//     // const battery = parsedData.battery;
//     // let param = parsedData
//     // const mapData = parsedData.Map;

//     // console.log('Position:', position);
//     // console.log('parsed data', parsedData);
//     console.log('message', parsedData);
//     const param = parsedData.param
    
//     // console.log('Battery', battery.percent);
//     // console.log('mapData', mapData);
//     if (param) {
      
//       console.log(param);
//     }


//     // console.log('X:', position.x);
//     // console.log('Y:', position.y);
//     // console.log('Z:', position.z);

//     // Echo the message back to the client
//     // ws.send(Server received: ${message});
//     const userData = {
//       param: param
//     }
//     // Send a welcome message to every new client
//     // ws.send('Welcome to the WebSocket server!');
//     ws.send(userData.param);

//   });

//   // const userData = {
//   //   param: ${param}
//   // }
//   // // Send a welcome message to every new client
//   ws.send('Welcome to the WebSocket server!');
//   // ws.send(userData.param);

//   // Handle client disconnect
//   ws.on('close', () => {
//     // console.log('Client has disconnected.');
//   });

//   // Handle any errors
//   ws.on('error', (error) => {
//     console.error('WebSocket error:', error);
//   });
// });

// console.log(WebSocket server is running on ws://${serverIP}:${serverPort});


const WebSocket = require('ws');

// Specify the server IP and port
// const serverIP = '192.168.3.144';
const serverIP = '192.168.3.146';
const serverPort = 8701;

// Create a WebSocket Server
const wss = new WebSocket.Server({ host: serverIP, port: serverPort });

wss.on('connection', function connection(ws) {
  // Send a welcome message to the newly connected client
  ws.send('Welcome to the WebSocket server!');

  // Handle incoming messages from clients
  ws.on('message', function incoming(message) {
    try {
      const parsedData = JSON.parse(message);
      const param = parsedData.param;

      if (param) {
        console.log('Broadcasting param:', param);
        // Broadcast the param to all connected clients
        wss.clients.forEach(function each(client) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(param);
          }
        });
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    console.log('Client has disconnected.');
  });

  // Handle any errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

console.log(`WebSocket server is running on ws://${serverIP}:${serverPort}`);
