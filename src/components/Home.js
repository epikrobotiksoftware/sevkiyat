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
    drop: false,
  })
  const IP = '0.0.0.0'
  const PORT = '9090'

  useEffect(() => {
    // connect()
    var pose_sub = new ROSLIB.Topic({
      ros: ros,
      name: '/BatteryStatus',
      messageType: 'mir_simulation/',
    })
    pose_sub.subscribe((message) => {
      setBattery(message.soc_percent)
    })
    return () => {}
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
          onClick={() => handleButtonClick('pick1')}
        >
          pick 1
        </Button>
        {renderExtensionButton('pick1')}
        <Button
          variant={isPressed.pick2 ? 'contained' : 'outlined'}
          onClick={() => handleButtonClick('pick2')}
        >
          pick 2
        </Button>
        {renderExtensionButton('pick2')}
        <Button
          variant={isPressed.pick3 ? 'contained' : 'outlined'}
          onClick={() => handleButtonClick('pick3')}
        >
          pick 3
        </Button>
        {renderExtensionButton('pick3')}
        <Button
          variant={isPressed.drop ? 'contained' : 'outlined'}
          onClick={() => handleButtonClick('drop')}
        >
          Drop
        </Button>
        {renderExtensionButton('drop')}
      </div>
    </>
  )
}
export default Home
