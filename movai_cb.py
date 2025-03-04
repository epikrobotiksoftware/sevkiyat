import asyncio
import websockets
import json
from sensor_msgs.msg import BatteryState
from geometry_msgs.msg import PoseWithCovarianceStamped
from nav_msgs.msg import Odometry
from rospy.timer import TimerEvent
from nav_msgs.msg import OccupancyGrid
from API2.Robot import Robot
from API2.Robot import FleetRobot
from movai_task_data.movai_tasks import get_movai_task_classes
from movai_common.msg import StringArray



import aiohttp
import asyncio
from API2.Robot import Robot
import json 
from std_srvs.srv import TriggerRequest, TriggerResponse

fvar = Var('flow')

# Server details
SERVER_IP = "192.168.3.146"
SERVER_PORT = 8701
SERVER_URL = f"ws://{SERVER_IP}:{SERVER_PORT}"

# Assuming gd.shared is defined elsewhere. For this example, we define a simple stub.
gd.shared.battery_percentage=None
gd.shared.battery_status=None
gd.shared.map_odometry_data=None
gd.shared.robotname=Robot().RobotName
gd.shared.robot_status=0
gd.shared.robots_status_map = {}  # Tüm robotların durumlarını saklamak için

class Websocket:
    def __init__(self):
        self.map_odometry_data = None
        self.battery_info=None
       
    def battery_publisher(self, msg: BatteryState):
        # Convert battery percentage to a rounded integer value
        self.battery_info = msg

    def get_map_odometry_data(self, msg: Odometry):
        self.map_odometry_data = msg

    def check_robot_status(self):
        """Robot'un filoda olup olmadığını kontrol eder ve durumunu günceller."""
        robots_in_fleet = {FleetRobot(robot_id).RobotName: robot_id for robot_id in Robot.get_all()}.keys()

        # Tüm robotları sıfır olarak başlat
        gd.shared.robots_status_map = {name: 0 for name in robots_in_fleet}

        # Eğer bu robot filoda varsa, durumunu 1 yap
        if gd.shared.robotname in robots_in_fleet:
            gd.shared.robots_status_map[gd.shared.robotname] = 1
            gd.shared.robot_status = 1  # Filoda olduğu için 1
        else:
            gd.shared.robot_status = 0  # Filoda yoksa 0

        # print(f"Tüm Robot Durumları: {gd.shared.robots_status_map}")  # Durumu görmek için
    
            
       
    def timer(self, msg: TimerEvent):
        gd.shared.battery_percentage = round(self.battery_info.percentage*100,2)
        gd.shared.battery_status = self.battery_info.power_supply_status
        gd.shared.map_odometry_data = self.map_odometry_data
        self.check_robot_status()

async def send_data():
    while True:
        try:
            async with websockets.connect(SERVER_URL) as websocket:
                logger.info(f"[Send] Connected to {SERVER_URL}")
                while True:

                    if gd.shared.map_odometry_data is not None and gd.shared.battery_percentage is not None and gd.shared.robotname is not None:
                        shared_data = {
                            "Robot":{
                                "Name":gd.shared.robotname,
                                "battery_percentage": gd.shared.battery_percentage,
                                "battery_status":gd.shared.battery_status,
                                "status": gd.shared.robot_status
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
                    print(f"[Receive] Received: {message}")
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
