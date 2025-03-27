const WebSocket = require('ws')
const http = require('http')

const { createMapImage } = require('./src/utils/helperFunctions')

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('WebSocket Server is running\n')
})

const wss = new WebSocket.Server({ server })

const reactClients = new Set()
const robotClients = new Set()

wss.on('connection', (ws, req) => {
  const isReact = req.url === '/react' // <-- Declare only once here

  if (isReact) {
    reactClients.add(ws)
    console.log('React client connected:', reactClients.size)
  } else {
    robotClients.add(ws)
    console.log('Robot client connected:', robotClients.size)
  }

  ws.on('message', (message) => {
    const parsedData = JSON.parse(message)
    if (parsedData.Map) {
      // console.log('Map:', parsedData.Map)
      createMapImage(parsedData.Map)
    }

    if (isReact) {
      robotClients.forEach((robot) => {
        if (robot.readyState === WebSocket.OPEN) {
          console.log(message)
          robot.send(message)
        }
      })
    } else {
      reactClients.forEach((react) => {
        if (react.readyState === WebSocket.OPEN) {
          react.send(message)
        }
      })
    }
  })

  ws.on('close', () => {
    console.log(`${isReact ? 'React' : 'Robot'} client disconnected`)
    if (isReact) {
      reactClients.delete(ws)
    } else {
      robotClients.delete(ws)
    }
  })

  ws.on('error', (error) => {
    console.error(`WebSocket error: ${error}`)
  })
})

const port = 8701
server.listen(port, () => {
  console.log(`WebSocket server is running on ws://localhost:${port}`)
})


