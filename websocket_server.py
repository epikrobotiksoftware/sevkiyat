import asyncio
import websockets

async def handle_connection(websocket, path):
    print("A new client connected!")
    try:
        # Send a welcome message to the client
        await websocket.send("Welcome to the WebSocket server!")

        async for message in websocket:
            print(f"Received: {message}")
            # Echo the message back to the client
            response = f"Server received: {message}"
            await websocket.send(response)
            
    except websockets.exceptions.ConnectionClosed as e:
        print(f"Client has disconnected: {e.reason}")
    except Exception as e:
        print(f"Error: {e}")

async def server():
    serverIP = 'localhost'  
    serverPort = 8701
    async with websockets.serve(handle_connection, serverIP, serverPort):
        print(f"WebSocket server is running on ws://{serverIP}:{serverPort}")
        await asyncio.Future() 

# Run the server within an asyncio event loop
asyncio.run(server())
