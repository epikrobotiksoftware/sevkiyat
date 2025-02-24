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

const WebSocket = require('ws')

const serverIP = '192.168.3.146'
const serverPort = 8701

// Create a WebSocket Server.
const wss = new WebSocket.Server({ host: serverIP, port: serverPort })

// A Map to store client metadata (e.g. client type)
const clients = new Map()

wss.on('connection', (ws) => {
  // Send a welcome message immediately
  ws.send(
    JSON.stringify({
      message:
        'Welcome to the WebSocket server! Please register your clientType.',
    })
  )

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message)

      // Client registration: identify type on first message
      if (data.clientType) {
        clients.set(ws, { type: data.clientType })
        ws.send(JSON.stringify({ message: `Registered as ${data.clientType}` }))
        console.log(`Client registered as ${data.clientType}`)
        return
      }

      // Routing based on message type and client type
      // Example: UI sends command messages to control the robot.
      if (data.command && typeof data.command === 'string') {
        // Find all robot clients and send the command only to them.
        wss.clients.forEach((client) => {
          const clientInfo = clients.get(client)
          if (
            clientInfo &&
            clientInfo.type === 'robot' &&
            client.readyState === WebSocket.OPEN
          ) {
            client.send(JSON.stringify({ command: data.command }))
          }
        })
        console.log('Forwarded command from UI to robot:', data.command)
      }

      // Example: Robot sends sensor data updates to be displayed in the UI.
      if (data.sensorUpdate) {
        // Forward the sensor update only to UI clients.
        wss.clients.forEach((client) => {
          const clientInfo = clients.get(client)
          if (
            clientInfo &&
            clientInfo.type === 'ui' &&
            client.readyState === WebSocket.OPEN
          ) {
            client.send(JSON.stringify({ sensorUpdate: data.sensorUpdate }))
          }
        })
        console.log('Forwarded sensor update from robot to UI.')
      }

      // Add additional message handling as needed.
    } catch (error) {
      console.error('Error processing message:', error)
      ws.send(JSON.stringify({ error: 'Invalid message format' }))
    }
  })

  ws.on('close', () => {
    // Remove the client from the metadata store on disconnect.
    clients.delete(ws)
    console.log('Client disconnected.')
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
  })
})

console.log(`WebSocket server is running on ws://${serverIP}:${serverPort}`)

// add this line to the robot
// async with websockets.connect(SERVER_URL) as websocket:
//     await websocket.send(json.dumps({"clientType": "robot"}))
//     # Continue with sending sensor data or handling commands...

// const WebSocket = require('ws')

// const serverIP = '192.168.3.146'
// const serverPort = 8701

// const wss = new WebSocket.Server({ host: serverIP, port: serverPort })

// // Keep separate sets for different types of clients
// const robotClients = new Set()
// const frontendClients = new Set()

// wss.on('connection', function connection(ws) {
//   console.log('A new client connected!')

//   ws.on('message', function incoming(message) {
//     let parsedData
//     try {
//       parsedData = JSON.parse(message)
//     } catch (error) {
//       console.error('Invalid JSON:', message)
//       return
//     }

//     // Check if it's a registration message
//     if (parsedData.type === 'register' && parsedData.clientType) {
//       ws.clientType = parsedData.clientType

//       if (ws.clientType === 'robot') {
//         robotClients.add(ws)
//         console.log('Robot registered')
//       } else if (ws.clientType === 'frontend') {
//         frontendClients.add(ws)
//         console.log('Frontend registered')
//       }
//       return // Don't process further
//     }

//     // Process messages differently based on client type
//     if (ws.clientType === 'robot') {
//       // Handle data coming from the robot
//       console.log('Robot data:', parsedData)
//       // You can broadcast this data to all frontend clients, for example:
//       frontendClients.forEach((client) => {
//         if (client.readyState === WebSocket.OPEN) {
//           client.send(JSON.stringify({ from: 'robot', data: parsedData }))
//         }
//       })
//     } else if (ws.clientType === 'frontend') {
//       // Handle data coming from the frontend
//       console.log('Frontend data:', parsedData)
//       // You might want to send this command to the robot:
//       robotClients.forEach((client) => {
//         if (client.readyState === WebSocket.OPEN) {
//           client.send(JSON.stringify({ from: 'frontend', data: parsedData }))
//         }
//       })
//     } else {
//       console.log('Unregistered client sent:', parsedData)
//     }
//   })

//   ws.send('Welcome to the WebSocket server!')

//   ws.on('close', () => {
//     // Clean up when a client disconnects
//     if (ws.clientType === 'robot') {
//       robotClients.delete(ws)
//       console.log('Robot disconnected')
//     } else if (ws.clientType === 'frontend') {
//       frontendClients.delete(ws)
//       console.log('Frontend disconnected')
//     }
//   })

//   ws.on('error', (error) => {
//     console.error('WebSocket error:', error)
//   })
// })

// console.log(`WebSocket server is running on ws://${serverIP}:${serverPort}`)
