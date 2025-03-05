const WebSocket = require('ws')
const http = require('http')

// Store connected clients
let reactClient = null
let robotClient = null

// Create HTTP server and WebSocket server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('WebSocket Server is running\n')
})

const wss = new WebSocket.Server({ server })

wss.on('connection', (ws, req) => {
  // Determine if this is the React or Robot client based on the path
  const role = req.url === '/react' ? 'react' : 'robot'

  console.log(`New ${role} client connected`)

  // Register the correct client
  if (role === 'react') {
    reactClient = ws
  } else if (role === 'robot') {
    robotClient = ws
  }

  // Handle incoming messages
  ws.on('message', (message) => {
    console.log(`Received message from ${role}:`)
    // console.log(`Received message from ${role}:`, message);

    // If the message comes from React, send it to the robot
    if (role === 'react' && robotClient) {
      const parsedData = JSON.parse(message)
      robotClient.send(parsedData.param)
      console.log('Sent message to robot:', parsedData.param)
    }

    // If the message comes from the robot, send it to React
    if (role === 'robot' && reactClient) {
      reactClient.send(message)
      // console.log('Sent message to React:', message);
    }
  })

  // Handle client disconnects
  ws.on('close', () => {
    console.log(`${role} client disconnected`)
    if (role === 'react') {
      reactClient = null
    } else if (role === 'robot') {
      robotClient = null
    }
  })

  // Handle WebSocket errors
  ws.on('error', (error) => {
    console.error(`WebSocket error: ${error}`)
  })
})

// Start the server
const port = 8701
server.listen(port, () => {
  console.log(`WebSocket server is running on ws://localhost:${port}`)
})
