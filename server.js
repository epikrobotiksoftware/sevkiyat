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

// const WebSocket = require('ws')

// const serverIP = '192.168.3.146'
// const serverPort = 8701

// // Create a WebSocket Server.
// const wss = new WebSocket.Server({ host: serverIP, port: serverPort })

// // A Map to store client metadata (e.g. client type)
// const clients = new Map()

// wss.on('connection', (ws) => {
//   // Send a welcome message immediately
//   ws.send(
//     JSON.stringify({
//       message:
//         'Welcome to the WebSocket server! Please register your clientType.',
//     })
//   )

//   ws.on('message', (message) => {
//     try {
//       const data = JSON.parse(message)

//       // Client registration: identify type on first message
//       if (data.clientType) {
//         clients.set(ws, { type: data.clientType })
//         ws.send(JSON.stringify({ message: `Registered as ${data.clientType}` }))
//         console.log(`Client registered as ${data.clientType}`)
//         return
//       }

//       // Routing based on message type and client type
//       // Example: UI sends command messages to control the robot.
//       if (data.command && typeof data.command === 'string') {
//         // Find all robot clients and send the command only to them.
//         wss.clients.forEach((client) => {
//           const clientInfo = clients.get(client)
//           if (
//             clientInfo &&
//             clientInfo.type === 'robot' &&
//             client.readyState === WebSocket.OPEN
//           ) {
//             client.send(JSON.stringify({ command: data.command }))
//           }
//         })
//         console.log('Forwarded command from UI to robot:', data.command)
//       }

//       // Example: Robot sends sensor data updates to be displayed in the UI.
//       if (data.sensorUpdate) {
//         // Forward the sensor update only to UI clients.
//         wss.clients.forEach((client) => {
//           const clientInfo = clients.get(client)
//           if (
//             clientInfo &&
//             clientInfo.type === 'ui' &&
//             client.readyState === WebSocket.OPEN
//           ) {
//             client.send(JSON.stringify({ sensorUpdate: data.sensorUpdate }))
//           }
//         })
//         console.log('Forwarded sensor update from robot to UI.')
//       }

//       // Add additional message handling as needed.
//     } catch (error) {
//       console.error('Error processing message:', error)
//       ws.send(JSON.stringify({ error: 'Invalid message format' }))
//     }
//   })

//   ws.on('close', () => {
//     // Remove the client from the metadata store on disconnect.
//     clients.delete(ws)
//     console.log('Client disconnected.')
//   })

//   ws.on('error', (error) => {
//     console.error('WebSocket error:', error)
//   })
// })

// console.log(`WebSocket server is running on ws://${serverIP}:${serverPort}`)

// add this line to the robot
// async with websockets.connect(SERVER_URL) as websocket:
//     await websocket.send(json.dumps({"clientType": "robot"}))
//     # Continue with sending sensor data or handling commands...


const WebSocket = require('ws');
const http = require('http');

// Store connected clients
let reactClient = null;
let robotClient = null;

// Create HTTP server and WebSocket server
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('WebSocket Server is running\n');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  // Determine if this is the React or Robot client based on the path
  const role = req.url === '/react' ? 'react' : 'robot';

  console.log(`New ${role} client connected`);

  // Register the correct client
  if (role === 'react') {
    reactClient = ws;
  } else if (role === 'robot') {
    robotClient = ws;
  }

  // Handle incoming messages
  ws.on('message', (message) => {
    console.log(`Received message from ${role}:`, message);

    // If the message comes from React, send it to the robot
    if (role === 'react' && robotClient) {
      robotClient.send(message);
      console.log('Sent message to robot:', message);
    }function connect() {
      try {
        const ws = new WebSocket(`ws://${WS_SERVER_IP}:${WS_SERVER_PORT}/react`);
    
        ws.onopen = () => {
          console.log('Connected to WebSocket server!');
          toast.success('Connected to WebSocket server!');
          setWsClient(ws);
        };
    
        ws.onmessage = (event) => {
          console.log('Message from server:', event.data);
          // Handle the message from the server (which might come from the robot)
        };
    
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          toast.error('WebSocket error');
        };
    
        ws.onclose = () => {
          console.log('WebSocket connection closed');
          toast.info('WebSocket connection closed');
          setWsClient(null);
        };
      } catch (error) {
        console.error(error);
      }
    }
    

    // If the message comes from the robot, send it to React
    if (role === 'robot' && reactClient) {
      reactClient.send(message);
      console.log('Sent message to React:', message);
    }
  });

  // Handle client disconnects
  ws.on('close', () => {
    console.log(`${role} client disconnected`);
    if (role === 'react') {
      reactClient = null;
    } else if (role === 'robot') {
      robotClient = null;
    }
  });

  // Handle WebSocket errors
  ws.on('error', (error) => {
    console.error(`WebSocket error: ${error}`);
  });
});

// Start the server
const port = 8701;
server.listen(port, () => {
  console.log(`WebSocket server is running on ws://localhost:${port}`);
});
