const WebSocket = require('ws')
const http = require('http')
const PImage = require('pureimage')
const fs = require('fs')
const crypto = require('crypto')

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('WebSocket Server is running\n')
})

const wss = new WebSocket.Server({ server })

const reactClients = new Set()
const robotClients = new Set()

// Global variable to store the hash of the last processed map.
let lastMapHash = null

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

async function createMapImage(mapData) {
  // Compute a hash of the incoming map data (info and data fields).
  const currentMapHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(mapData.info))
    .update(JSON.stringify(mapData.data))
    .digest('hex')

  // Only create the image if the map data is different than the last processed one.
  if (lastMapHash === currentMapHash) {
    console.log('Map has not changed, skipping image generation')
    return
  }
  lastMapHash = currentMapHash

  const width = mapData.info.width
  const height = mapData.info.height
  const data = mapData.data

  // Create the initial image and set pixels based on the occupancy data.
  const img = PImage.make(width, height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      const cellValue = data[idx]
      let r, g, b, a
      // Map occupancy values to colors:
      // 0 (free)        -> white (255, 255, 255, 255)
      // 100 (occupied)  -> black (0, 0, 0, 255)
      // other values    -> gray (127, 127, 127, 255)
      if (cellValue === 0) {
        r = 255
        g = 255
        b = 255
        a = 255
      } else if (cellValue === 100) {
        r = 0
        g = 0
        b = 0
        a = 255
      } else {
        r = 127
        g = 127
        b = 127
        a = 255
      }
      const pixelIndex = (y * width + x) * 4
      img.data[pixelIndex] = r
      img.data[pixelIndex + 1] = g
      img.data[pixelIndex + 2] = b
      img.data[pixelIndex + 3] = a
    }
  }

  // Apply the transformation:
  // The original Jimp code did:
  //   image.rotate(180)
  //   image.mirror(true, false)
  // For a pixel at (x, y), a 180° rotation maps it to (width-1-x, height-1-y),
  // then mirroring horizontally maps that to (x, height-1-y).
  // That is equivalent to a vertical flip.
  // We'll create a new image with the same dimensions and copy pixels accordingly.
  const finalImg = PImage.make(width, height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // The new Y coordinate is flipped vertically.
      const srcIdx = (y * width + x) * 4
      const dstIdx = ((height - 1 - y) * width + x) * 4
      finalImg.data[dstIdx] = img.data[srcIdx]
      finalImg.data[dstIdx + 1] = img.data[srcIdx + 1]
      finalImg.data[dstIdx + 2] = img.data[srcIdx + 2]
      finalImg.data[dstIdx + 3] = img.data[srcIdx + 3]
    }
  }

  // Save the final image as PNG.
  const outputPath = 'src/assets/map.png'
  await PImage.encodePNGToStream(finalImg, fs.createWriteStream(outputPath))
  console.log('Map image created as ' + outputPath)
}
