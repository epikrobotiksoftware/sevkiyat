import asyncio
import websockets
import json
from sensor_msgs.msg import BatteryState
from geometry_msgs.msg import PoseWithCovarianceStamped
from nav_msgs.msg import Odometry
from rospy.timer import TimerEvent
from nav_msgs.msg import OccupancyGrid
from API2.Robot import Robot

# Server details
SERVER_IP = "192.168.3.146"
SERVER_PORT = 8701
SERVER_URL = f"ws://{SERVER_IP}:{SERVER_PORT}"

# Assuming gd.shared is defined elsewhere. For this example, we define a simple stub.
gd.shared.battery=None
gd.shared.map_odometry_data=None

class Websocket:
    def __init__(self):
     
        self.map_odometry_data = None

        self.battery_percentage = None

    def battery_publisher(self, msg: BatteryState):
        # Convert battery percentage to a rounded integer value
        self.battery_percentage = round(msg.percentage * 100, 1)

    def get_map_odometry_data(self, msg: Odometry):
        self.map_odometry_data = msg

    
    def timer(self, msg: TimerEvent):
        # Update the shared data

        gd.shared.battery = self.battery_percentage
        gd.shared.map_odometry_data = self.map_odometry_data

async def send_data():
    while True:
        try:
            async with websockets.connect(SERVER_URL) as websocket:
                logger.info(f"[Send] Connected to {SERVER_URL}")

                # Try to get a welcome message from the server with a timeout.
                try:
                    welcome_message = await asyncio.wait_for(websocket.recv(), timeout=5)
                    # logger.info(f"[Send] Server (welcome): {welcome_message}")
                except (asyncio.TimeoutError, websockets.ConnectionClosed):
                    logger.error("[Send] No welcome message received or connection closed. Reconnecting...")
                    continue  # Reconnect by restarting the outer loop

                # Once connected, continuously send data as it becomes available.
                while True:
                    if gd.shared.map_odometry_data is not None and gd.shared.battery is not None:
                        shared_data = {
                            "battery": {
                                "percent": gd.shared.battery
                            },
                            "Map": {
                                "position": {
                                    "x": gd.shared.map_odometry_data.pose.pose.position.x,
                                    "y": gd.shared.map_odometry_data.pose.pose.position.y,
                                    "z": gd.shared.map_odometry_data.pose.pose.position.z
                                },
                                "orientation": {
                                    "x": gd.shared.map_odometry_data.pose.pose.orientation.x,
                                    "y": gd.shared.map_odometry_data.pose.pose.orientation.y,
                                    "z": gd.shared.map_odometry_data.pose.pose.orientation.z,
                                    "w": gd.shared.map_odometry_data.pose.pose.orientation.w,
                                }
                            }
                        }
                        message = json.dumps(shared_data)
                        await websocket.send(message)
                        # logger.info(f"[Send] Sent: {message}")
                        await asyncio.sleep(1)  # Delay between sends
                    else:
                        await asyncio.sleep(0.1)  # Wait briefly if data is not yet available

        except (websockets.ConnectionClosedError, OSError) as e:
            logger.error(f"[Send] Connection lost: {e}. Reconnecting in 5 seconds...")
            await asyncio.sleep(5)
        except Exception as e:
            logger.error(f"[Send] Unexpected error: {e}. Reconnecting in 5 seconds...")
            await asyncio.sleep(5)

async def receive_data():
    while True:
        try:
            async with websockets.connect(SERVER_URL) as websocket:
                logger.info(f"[Receive] Connected to {SERVER_URL}")

                # Continuously receive and print messages from the server.
                while True:
                    message = await websocket.recv()
                    logger.info(f"[Receive] Received: {message}")
                    gd.oport["/out_selection"].send({'/out_selection': message})


        except (websockets.ConnectionClosedError, OSError) as e:
            logger.error(f"[Receive] Connection lost: {e}. Reconnecting in 5 seconds...")
            await asyncio.sleep(5)
        except Exception as e:
            logger.error(f"[Receive] Unexpected error: {e}. Reconnecting in 5 seconds...")
            await asyncio.sleep(5)

# Create an instance of our Websocket helper and map our callback methods.
websocket_instance = Websocket()
gd.shared.map_to_method = {
    "map_odometry": websocket_instance.get_map_odometry_data,
    "battery": websocket_instance.battery_publisher,
    "update_loop": websocket_instance.timer
}

async def main():
    # Run both sending and receiving concurrently.
    send_task = asyncio.create_task(send_data())
    receive_task = asyncio.create_task(receive_data())
    await asyncio.gather(send_task, receive_task)

# Start the event loop, either by using the running loop or creating a new one.
try:
    loop = asyncio.get_running_loop()
    loop.create_task(main())
except RuntimeError:
    asyncio.run(main())
