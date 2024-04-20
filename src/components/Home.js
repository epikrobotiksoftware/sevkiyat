import React, { useState, useEffect } from 'react'
import * as ROSLIB from 'roslib'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Button from '@mui/material/Button'
import BatteryStatus from './BatteryStatus'
import { FaArrowCircleRight } from 'react-icons/fa'
import Logo from './Logo'
import styles from './home.module.css'

function Home() {
  const [battery, setBattery] = useState(0)
  const [ros, setRos] = useState(new ROSLIB.Ros())
  const [isPressed, setIsPressed] = useState({
    out1: false,
    out2: false,
    out3: false,
    out4: false,
  })
  const IP = '172.23.0.12'
  const PORT = '9090'
  const battery_sub = new ROSLIB.Topic({
    ros: ros,
    name: '/amr1_navigation__amr1__battery__battery/battery/out',
    messageType: 'sensor_msgs/BatteryState',
  })

  useEffect(() => {
    // connect()
    if (battery == 0) {
      battery_sub.subscribe((message) => {
        setBattery(parseInt(message.percentage * 100))
      })
    }
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
      [button]: !prevState[button],
    }))
    // var param = new ROSLIB.Param({
    //   ros: ros,
    //   name: '/out_selection',
    // })
    // param.set(button)
  }

  const handleParam = (button) => {
    var param = new ROSLIB.Param({
      ros: ros,
      name: '/out_selection',
    })
    param.set(button)
  }

  const renderExtensionButton = (button) => {
    if (isPressed[button]) {
      return (
        <div className={styles.extensionButtonWrapper}>
          <Button
            disabled={!isPressed[button]}
            variant='outlined'
            style={{ minWidth: 1, padding: 1, width: 'fit-content' }}
            onClick={() => handleParam(button)}
          >
            <FaArrowCircleRight style={{ fontSize: '2.3em' }} />
          </Button>
        </div>
      )
    }

    return null
  }

  return (
    <>
      <div>
        <Logo /> {/* Include the Logo component */}
        <BatteryStatus level={battery} />
        <ToastContainer />
        <div className={styles.container}>
          {/* <Button onClick={connect}>Connect</Button> */}
          <h3 style={{ color: '#1976D2' }}>
            {ros.isConnected ? (
              'Connected'
            ) : (
              <Button onClick={connect}>Connect</Button>
            )}
          </h3>
          <Button onClick={checkConnection}>Check connection</Button>
        </div>
        <div className={styles.pickButtons}>
          <div className={styles.pickColumn}>
            <Button
              className={styles.pickButton}
              variant={isPressed.out1 ? 'contained' : 'outlined'}
              onClick={() => handleButtonClick('out1')}
            >
              pick 1
            </Button>
            {renderExtensionButton('out1')}
            <Button
              className={styles.pickButton}
              variant={isPressed.out2 ? 'contained' : 'outlined'}
              onClick={() => handleButtonClick('out2')}
            >
              pick 2
            </Button>
            {renderExtensionButton('out2')}
            <Button
              className={styles.pickButton}
              variant={isPressed.out3 ? 'contained' : 'outlined'}
              onClick={() => handleButtonClick('out3')}
            >
              pick 3
            </Button>
            {renderExtensionButton('out3')}
          </div>
          <div>
            <Button
              variant={isPressed.out4 ? 'contained' : 'outlined'}
              onClick={() => handleButtonClick('out4')}
            >
              Park
            </Button>
            {renderExtensionButton('out4')}
          </div>
        </div>
      </div>
    </>
  )
}

export default Home
