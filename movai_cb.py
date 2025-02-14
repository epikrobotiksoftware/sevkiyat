import asyncio
import websockets
import logging
import json
from rospy.timer import TimerEvent
from sensor_msgs.msg import BatteryState

# Configure logging
logging.basicConfig(level=logging.INFO)

class Websocket:
    def __init__(self):
        self.amcl_data = None
        self.map_odometry_data = None
        self.map_data=None
        self.battery_percentage=None
        self.uri = "ws://192.168.3.27:8701"

    def amcl(self, msg:PoseWithCovarianceStamped):
        self.amcl_data = msg
    
    # def occupancy_grid_callback(self, msg):
    #     # Retrieve occupancy grid properties
    #     width = msg.info.width
    #     height = msg.info.height
    #     data = msg.data

    #     # Create PIL image from occupancy grid data
    #     image = PILImage.new('L', (width, height))
    #     for y in range(height):
    #         for x in range(width):
    #             index = y * width + x
    #             value = data[index]
    #             inverted_value = 255 if value == 0 else 0
    #             image.putpixel((x, y), inverted_value)

    #     # Convert PIL image to Base64 string
    #     buffered = io.BytesIO()
    #     image.save(buffered, format='JPEG')
    #     self.image_base64 = base64.b64encode(
    #         buffered.getvalue()).decode('utf-8')
    def battery_publisher(self,msg:BatteryState):
        # print("battery percentage: ", msg.percentage)
        self.battery_percentage=msg.percentage
    
    def get_map_odometry_data(self, msg:Odometry):
        self.map_odometry_data = msg
        # self.occupancy_grid_callback(msg)
        
    def map_get_data(self,msg:OccupancyGrid):
        self.map_data=msg
        print("data: ",self.map_data)
        
        
    async def send_map_and_amcl_data(self):
        print(self.battery_percentage)
        while True:
            try:
                async with websockets.connect(self.uri) as websocket:
                    logging.info("Connected to server")
                    while self.amcl_data and self.map_odometry_data:
                        # Serialize the ROS message data
                        # amcl_data_json = json.dumps({
                        #     'position': {
                        #         'x': self.amcl_data.pose.pose.position.x,
                        #         'y': self.amcl_data.pose.pose.position.y,
                        #         'z': self.amcl_data.pose.pose.position.z
                        #     },
                        #     'orientation': {
                        #         'x': self.amcl_data.pose.pose.orientation.x,
                        #         'y': self.amcl_data.pose.pose.orientation.y,
                        #         'z': self.amcl_data.pose.pose.orientation.z,
                        #         'w': self.amcl_data.pose.pose.orientation.w
                        #     }
                        # })

                        # map_data_json = json.dumps({
                        #     'position': {
                        #         'x': self.map_data.pose.pose.position.x,
                        #         'y': self.map_data.pose.pose.position.y,
                        #         'z': self.map_data.pose.pose.position.z
                        #     },
                        #     'velocity': {
                        #         'linear': self.map_data.twist.twist.linear.x,
                        #         'angular': self.map_data.twist.twist.angular.z
                        #     }
                        # })
                        combined_data = {
                            # 'amcl': {
                            #     'position': {
                            #         'x': self.amcl_data.pose.pose.position.x,
                            #         'y': self.amcl_data.pose.pose.position.y,
                            #         'z': self.amcl_data.pose.pose.position.z
                            #     },
                            #     'orientation': {
                            #         'x': self.amcl_data.pose.pose.orientation.x,
                            #         'y': self.amcl_data.pose.pose.orientation.y,
                            #         'z': self.amcl_data.pose.pose.orientation.z,
                            #         'w': self.amcl_data.pose.pose.orientation.w
                            #     }
                            # },
                            # 'map': {
                            #     'position': {
                            #         'x': self.map_odometry_data.pose.pose.position.x,
                            #         'y': self.map_odometry_data.pose.pose.position.y,
                            #         'z': self.map_odometry_data.pose.pose.position.z
                            #     },
                            #     'velocity': {
                            #         'linear': self.map_odometry_data.twist.twist.linear.x,
                            #         'angular': self.map_odometry_data.twist.twist.angular.z
                            #     }
                            # },
                            'battery':{
                                'percent': self.battery_percentage
                            }
                            
                        }

                        # Serialize the combined data
                        combined_data_json = json.dumps(combined_data)
                        # amcl_data_json = self.amcl_data
                        # map_data_json = self.map_data
                        # Send the serialized data
                        await websocket.send(combined_data_json)
                        # await websocket.send(map_data_json)

                        # Wait before sending the next update
                        await asyncio.sleep(5)
            except websockets.ConnectionClosed as e:
                logging.error(f"Connection closed: {e.code} - {e.reason}")
                logging.info("Reconnecting in 5 seconds...")
                await asyncio.sleep(5)
            except Exception as e:
                logging.error(f"An error occurred: {e}")
                logging.info("Reconnecting in 5 seconds...")
                await asyncio.sleep(5)

    def update_loop(self, msg: TimerEvent):
        # Create and set a new event loop for the current thread if needed
        if self.battery_percentage != None:
            try:
                loop = asyncio.get_event_loop()
                print("GO")
            except RuntimeError:
                print("error")
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            loop.run_until_complete(self.send_map_and_amcl_data())
        # print("data:",self.data)

web_socket = Websocket()

gd.shared.map_to_method = {
    'amcl': web_socket.amcl,
    'map_odometry': web_socket.get_map_odometry_data,
    'map_weboscket': web_socket.map_get_data,
    'battery': web_socket.battery_publisher,
    'loop': web_socket.update_loop
}

