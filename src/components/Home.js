import { useState, useEffect } from 'react'
import * as ROSLIB from 'roslib'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Button from '@mui/material/Button'
import BatteryStatus from './BatteryStatus'
import { FaArrowCircleRight } from 'react-icons/fa'

function Home() {
  const [battery, setBattery] = useState(0)
  const [ros, setRos] = useState(new ROSLIB.Ros())
  const [isPressed, setIsPressed] = useState({
    pick1: false,
    pick2: false,
    pick3: false,
    park: false,
  })
  const IP = '172.23.0.12'
  const PORT = '9090'

  const battery_sub = new ROSLIB.Topic({
    ros: ros,
    name: '/amr1_navigation__amr1__battery__battery/battery/out',
    messageType: 'sensor_msgs/BatteryState',
  })

  useEffect(() => {
    connect()
    if (battery == 0) {
      battery_sub.subscribe((message) => {
        setBattery(parseInt(message.percentage * 100))
      })
    }

    return () => { }
  }, [])

  function connect() {
    try {
      ros.connect('ws://' + IP + ':' + PORT + '')
    } catch (error) {
      console.log(error)
    }
  }

  function checkConnection() {
    console.log(ros.isConnected)
    if (ros.isConnected) {
      toast.success('Robot is Connected')
    } else {
      toast.error('Robot is not Connected')
    }
  }

  const handleButtonClick = (button) => {
    setIsPressed((prevState) => ({
      //   ...prevState,
      [button]: !prevState[button],
    }))

    var param = new ROSLIB.Param({
      ros: ros,
      name: '/out_selection'
    });
    param.set(button);
  }

  const renderExtensionButton = (button) => {
    if (isPressed[button]) {
      return (
        <Button
          disabled={!isPressed[button]}
          variant='outlined'
          style={{ minWidth: 1, padding: 1, width: 'fit-content' }}
        >
          <FaArrowCircleRight style={{ fontSize: '2.3em' }} />
        </Button>
      )
    }

    return null
  }

  return (
    <>
      <div>
        <BatteryStatus level={battery} />
        <ToastContainer />

        <h1>
          {ros.isConnected ? (
            'Connected'
          ) : (
            <Button onClick={connect}>Connect</Button>
          )}
        </h1>

        <Button onClick={checkConnection}>Check connection </Button>
        <Button
          variant={isPressed.pick1 ? 'contained' : 'outlined'}
          onClick={() => handleButtonClick('out1')}
        >
          pick 1
        </Button>
        {renderExtensionButton('pick1')}
        <Button
          variant={isPressed.pick2 ? 'contained' : 'outlined'}
          onClick={() => handleButtonClick('out2')}
        >
          pick 2
        </Button>
        {renderExtensionButton('pick2')}
        <Button
          variant={isPressed.pick3 ? 'contained' : 'outlined'}
          onClick={() => handleButtonClick('out3')}
        >
          pick 3
        </Button>
        {renderExtensionButton('pick3')}
        <Button
          variant={isPressed.park ? 'contained' : 'outlined'}
          onClick={() => handleButtonClick('out4')}
        >
          Park
        </Button>
        {renderExtensionButton('park')}
      </div>
    </>
  )
}
export default Home
