import React, { useEffect, useState, useRef } from 'react'
import createjs from 'createjs-module'
import * as ROS2D from 'ros2d'
import * as ROSLIB from 'roslib'
import { Button } from 'react-bootstrap'
import car from '../assets/car.png'
import goal from '../assets/goal.png'
import dot from '../assets/dot.png'
import waypoint from '../assets/waypoint.png'
import getYawFromQuat from '../scripts/helper'

const Map = (props) => {
  const ros = props.ros
  const [mapEdit, setmapEdit] = useState(false)
  const [points, setpoints] = useState(null)
  var viewer
  var gridClient
  var canvas
  var context
  var robotMarker = {}
  var panView
  var zoomView
  var goalMarker
  var pathMarker
  const map = useRef(null)

  useEffect(() => {
    view_map()
    map.current.style.pointerEvents = 'none'
    // scan_sub.subscribe((message) => {
    //   var angle_min = (message.angle_min * 180) / Math.PI;
    //   var angle_max = (message.angle_max * 180) / Math.PI;
    //   var angle_inc = (message.angle_increment * 180) / Math.PI;
    //   console.log("angle min " + angle_min);
    //   console.log("angle_max " + angle_max);
    //   console.log("angle_inc " + angle_inc);
    //   var i = 0;
    //   var robot_x = robotMarker.x;
    //   var robot_y = robotMarker.y;
    //   console.log("robot x: " + robot_x);
    //   console.log("robot y: " + robot_y);
    //   for (
    //     var angle = angle_min;
    //     angle < angle_min + 30;//angle_max;
    //     angle = angle + angle_inc
    //   ) {
    //   var robot_to_point_dist = message.ranges[i];
    //   var point_x = Math.sin(angle) * robot_to_point_dist;
    //   var point_y = Math.cos(angle) * robot_to_point_dist;
    //   point_x = parseFloat(point_x) + parseFloat(robot_x);
    //   point_y = parseFloat(point_y) + parseFloat(robot_y);
    //   0 - 20 -> 0 -> 860
    //   -20 - 0 -> 0 -> 680
    //   point_x = map_range(0,20,0,860,point_x);
    //   point_y = map_range(-20,0,0,680,point_y);
    //   context.fillRect(point_x, point_y, 10, 10);
    //   var dotMarker = new ROS2D.NavigationImage({
    //     size: 0.3,
    //     image: dot,
    //     pulse: false,
    //     alpha: 1,
    //   });
    //   dotMarker.x = point_x;
    //   dotMarker.y = point_y;
    //   viewer.scene.addChild(dotMarker);

    //   console.log("x" + point_x);
    //   console.log("y" + point_y);
    //   console.log("dist" + robot_to_point_dist);
    //   console.log("angle_min" + angle_min);
    //   i++;
    //   }
    //   scan_sub.unsubscribe();
    //   console.log(message);
    // });
  }, [])

  function init_click_handels() {
    var mouseDown = false
    var zoomKey = false
    var panKey = false
    var startPos = new ROSLIB.Vector3()
    var clickedPolygon = false
    var selectedPointIndex = null
    var dbclick = false

    var pointCallBack = function (type, event, index) {
      if (type === 'mousedown') {
        if (event.nativeEvent.shiftKey === true) {
          polygon.remPoint(index)
        } else {
          selectedPointIndex = index
        }
      }
      clickedPolygon = true
    }

    var lineCallBack = function (type, event, index) {
      if (type === 'mousedown') {
        if (event.nativeEvent.ctrlKey === true) {
          polygon.splitLine(index)
        }
      }
      clickedPolygon = true
    }

    // Create the polygon
    var polygon = new ROS2D.PolygonMarker({
      pointSize: 0.3,
      lineSize: 0.1,
      pointColor: createjs.Graphics.getRGB(255, 0, 0, 0.3),
      // fillColor: createjs.Graphics.getRGB(0, 0, 152, 0),
      // lineColor: createjs.Graphics.getRGB(250, 100, 255, 1),
      pointCallBack: pointCallBack,
      lineCallBack: lineCallBack,
    })
    viewer.scene.addChild(polygon)

    viewer.scene.mouseMoveOutside = false // doesn't seem to work

    // Event listeners for mouse interaction with the stage
    viewer.scene.addEventListener('stagemousedown', function (event) {
      dbclick = false
      if (event.nativeEvent.ctrlKey === true) {
        zoomKey = true
        zoomView.startZoom(event.stageX, event.stageY)
      } else if (event.nativeEvent.shiftKey === true) {
        panKey = true
        panView.startPan(event.stageX, event.stageY)
      }
      startPos.x = event.stageX
      startPos.y = event.stageY
      mouseDown = true
    })

    viewer.scene.addEventListener('stagemousemove', function (event) {
      if (dbclick === true) return
      // Move point when it's dragged
      if (selectedPointIndex !== null && !panKey && !zoomKey) {
        var pos = viewer.scene.globalToRos(event.stageX, event.stageY)
        polygon.movePoint(selectedPointIndex, pos)
        setpoints(polygon.pointContainer)
        clickedPolygon = true
      } else if (mouseDown === true) {
        if (zoomKey === true) {
          var dy = event.stageY - startPos.y
          var zoom = 1 + (10 * Math.abs(dy)) / viewer.scene.canvas.clientHeight
          if (dy < 0) zoom = 1 / zoom
          zoomView.zoom(zoom)
        } else if (panKey === true) {
          panView.pan(event.stageX, event.stageY)
        }
      }
    })

    viewer.scene.addEventListener('stagemouseup', function (event) {
      // Add point when not clicked on the polygon
      if (selectedPointIndex !== null && !panKey && !zoomKey) {
        selectedPointIndex = null
      } else if (
        viewer.scene.mouseInBounds === true &&
        clickedPolygon === false &&
        !panKey &&
        !zoomKey
      ) {
        var pos = viewer.scene.globalToRos(event.stageX, event.stageY)
        polygon.addPoint(pos)
        // if(polygon.pointContainer.children.length == 1){
        //   polygon.addPoint(pos);
        // }
        setpoints(polygon.pointContainer)
      } else if (mouseDown === true) {
        if (zoomKey === true) {
          zoomKey = false
        } else if (panKey === true) {
          panKey = false
        }
        mouseDown = false
      }
      clickedPolygon = false
    })

    viewer.scene.addEventListener('dblclick', function (event) {
      selectedPointIndex = polygon.pointContainer.children.length - 1
      polygon.remPoint(selectedPointIndex)
      dbclick = true
      var pos = viewer.scene.globalToRos(event.stageX, event.stageY)
      var goal_pub = new ROSLIB.Topic({
        ros: ros,
        name: '/move_base_simple/goal',
        messageType: 'geometry_msgs/PoseStamped',
      })
      var goal = new ROSLIB.Message({
        header: {
          frame_id: 'map',
        },
        pose: {
          position: {
            x: pos.x,
            y: pos.y,
            z: 0,
          },
          orientation: {
            x: 0,
            y: 0,
            z: 0,
            w: 1,
          },
        },
      })
      goal_pub.publish(goal)
    })
  }

  function init_markers() {
    robotMarker = new ROS2D.NavigationImage({
      size: 1.5,
      image: car,
      pulse: false,
      alpha: 1,
    })

    robotMarker.x = 100
    robotMarker.y = 100
    robotMarker.rotation = 0
    viewer.scene.addChild(robotMarker)

    var pose_sub = new ROSLIB.Topic({
      ros: ros,
      name: `robot_pose`,
      messageType: 'geometry_msgs/Pose',
    }).subscribe((message) => {
      robotMarker.x = message.position.x.toFixed(2)
      robotMarker.y = -message.position.y.toFixed(2)
      robotMarker.rotation = (-getYawFromQuat(message.orientation)).toFixed(2)
    })

    // var param = new ROSLIB.Param({
    //   ros: ros,
    //   name: "/robot_names",
    // });
    // param.get((names) => {
    //   if(names==undefined) return;
    //   names.forEach((name) => {
    //     robotMarker[name] = new ROS2D.NavigationImage({
    //       size: 1.5,
    //       image: car,
    //       pulse: false,
    //       alpha: 1,
    //     });

    //     robotMarker[name].x = 100;
    //     robotMarker[name].y = 100;
    //     robotMarker[name].rotation = 0;
    //     viewer.scene.addChild(robotMarker[name]);

    //     var pose_sub = new ROSLIB.Topic({
    //       ros: ros,
    //       name: `/${name}/robot_pose`,
    //       messageType: "geometry_msgs/Pose",
    //     }).subscribe((message) => {
    //       robotMarker[name].x = message.position.x.toFixed(2);
    //       robotMarker[name].y = -message.position.y.toFixed(2);
    //       robotMarker[name].rotation = (-getYawFromQuat(
    //         message.orientation
    //       )).toFixed(2);
    //     });
    //   });
    // });

    goalMarker = new ROS2D.NavigationImage({
      size: 1,
      image: goal,
      alpha: 1,
      pulse: false,
    })

    pathMarker = new ROS2D.PathShape({
      strokeSize: 0.05,
      strokeColor: createjs.Graphics.getRGB(255, 50, 30),
    })

    viewer.scene.addChild(pathMarker)
  }

  function init_subscribers() {
    var goal_sub = new ROSLIB.Topic({
      ros: ros,
      name: '/move_base_simple/goal',
      messageType: 'geometry_msgs/PoseStamped',
    }).subscribe((message) => {
      var yaw = getYawFromQuat(message.pose.orientation)
      goalMarker.x = message.pose.position.x
      goalMarker.y = -message.pose.position.y
      goalMarker.rotation = yaw
      viewer.scene.addChild(goalMarker)
    })

    var path_sub = new ROSLIB.Topic({
      ros: ros,
      name: '/move_base_node/SBPLLatticePlanner/plan',
      messageType: 'nav_msgs/Path',
    }).subscribe((message) => {
      pathMarker.setPath(message)
    })

    // var scan_sub = new ROSLIB.Topic({
    //   ros: ros,
    //   name: "/scan",
    //   messageType: "sensor_msgs/LaserScan",
    // }).subscribe((message) => {
    //   // console.log(message);
    // });
  }

  function view_map() {
    if (map.current.innerHTML !== '') return

    viewer = new ROS2D.Viewer({
      divID: 'map',
      width: 860,
      height: 680,
    })
    zoomView = new ROS2D.ZoomView({
      rootObject: viewer.scene,
    })
    panView = new ROS2D.PanView({
      rootObject: viewer.scene,
    })
    gridClient = new ROS2D.OccupancyGridClient({
      ros: ros,
      rootObject: viewer.scene,
      continuous: false,
    })

    gridClient.on('change', () => {
      viewer.scaleToDimensions(
        gridClient.currentGrid.width,
        gridClient.currentGrid.height
      )
      try {
        viewer.shift(
          gridClient.currentGrid.pose.position.x,
          gridClient.currentGrid.pose.position.y
        )
      } catch (err) {
        return
      }
    })

    init_click_handels()
    getPolygonsFromRos()
    getWaypointsFromRos()
    init_markers()
    init_subscribers()
  }

  function enableEdit() {
    setmapEdit(!mapEdit)
    map.current.style.pointerEvents = mapEdit ? 'none' : 'auto'
  }

  function saveZone() {
    if (points === null) return
    var new_point_pub = new ROSLIB.Topic({
      ros: ros,
      name: '/create_new_zone',
      messageType: 'mir_msgs/NewZone',
    })
    var msg = new ROSLIB.Message({
      point_count: points.children.length,
      type: 1,
      points: [],
    })

    for (let index = 0; index < points.children.length; index++) {
      msg.points.push({
        x: points.children[index].x,
        y: -points.children[index].y,
        z: 0,
      })
    }
    new_point_pub.publish(msg)
    resetMap()
  }

  function resetMap() {
    map.current.innerHTML = ''
    view_map()
  }

  function getPolygonsFromRos() {
    var polygons = []
    var polygon_sub = new ROSLIB.Topic({
      ros: ros,
      name: '/zones',
      messageType: 'mir_msgs/Zone',
    })
    polygon_sub.subscribe((message) => {
      let contains = false
      for (let index = 0; index < polygons.length; index++) {
        if (polygons[index].zone_id === message.zone_id) {
          contains = true
          break
        }
      }
      if (!contains) {
        polygons.push(message)
        updatePolygons(polygons)
      }
    })
  }

  function getWaypointsFromRos() {
    var poses = []
    var waypoint_sub = new ROSLIB.Topic({
      ros: ros,
      name: '/waypoints',
      messageType: 'geometry_msgs/PoseArray',
    })
    waypoint_sub.subscribe((message) => {
      if (poses.length !== message.poses.length) updateWaypoints(message.poses)
      poses = message.poses
    })
  }

  function updatePolygons(polygons) {
    for (let index = 0; index < polygons.length; index++) {
      let pointColor = null
      switch (polygons[index].zone_type) {
        case 1: // Critical Zone
          pointColor = createjs.Graphics.getRGB(255, 0, 0, 0.1)
          break
        case 2: // Speed Zone
          pointColor = createjs.Graphics.getRGB(0, 0, 255, 0.1)
          break
        default:
          pointColor = createjs.Graphics.getRGB(0, 0, 0, 0.1)
          break
      }
      var polygon_iterator = new ROS2D.PolygonMarker({
        pointSize: 0.000001,
        lineSize: 0.06,
        pointColor: pointColor,
        lineColor: createjs.Graphics.getRGB(250, 0, 0, 1),
        // pointCallBack: pointCallBack,
        // lineCallBack: lineCallBack,
      })
      viewer.scene.addChild(polygon_iterator)
      for (
        let index2 = 0;
        index2 < polygons[index].polygon.points.length;
        index2++
      ) {
        polygon_iterator.addPoint(polygons[index].polygon.points[index2])
      }
    }
  }

  function updateWaypoints(poses) {
    for (let index = 0; index < poses.length; index++) {
      var waypointMarker = new ROS2D.NavigationImage({
        size: 1.5,
        image: waypoint,
        pulse: false,
        alpha: 1,
      })

      waypointMarker.x = poses[index].position.x
      waypointMarker.y = -poses[index].position.y
      waypointMarker.rotation = 270
      viewer.scene.addChild(waypointMarker)
    }
  }

  return (
    <div>
      <p>Live Map</p>
      <Button variant={mapEdit ? 'info' : 'warning'} onClick={enableEdit}>
        {mapEdit ? 'Disable Edit' : 'Enable Edit'}
      </Button>
      <Button onClick={saveZone}>Save Zone</Button>
      <Button onClick={resetMap} variant='info'>
        Reset Map
      </Button>
      <br />
      <br />
      <div ref={map} id='map'></div>
    </div>
  )
}

export default Map
