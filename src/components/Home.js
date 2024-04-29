import React, { useState, useEffect } from 'react'
import * as ROSLIB from 'roslib'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Button from '@mui/material/Button'
import BatteryStatus from './BatteryStatus'
import { FaArrowCircleRight } from 'react-icons/fa'
import Logo from './Logo'
import styles from './home.module.css'
import Map from './Map'

function Home() {
  const [battery, setBattery] = useState(0)
  const [ros, setRos] = useState(new ROSLIB.Ros())
  const [isPressed, setIsPressed] = useState({
    out1: false,
    out2: false,
    out3: false,
    out4: false,
    out5: false,
    out6: false,

    park: false,
  })
  const [param, setParam] = useState('')
  const IP = '172.20.0.12'
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
    if (battery > 1 && battery < 20) {
      toast.error('Battery level is too low , Robot is going to parking...')
      handleParam('park')
      return
    }
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
    setParam(button)
  }

  function refreshPage() {
    window.location.reload()
  }
  function handleCurrentParam(param) {
    const paramDescriptions = {
      out1: 'İSTASYON 1',
      out2: 'İSTASYON 2',
      out3: 'İSTASYON 3',
      out4: 'İSTASYON 4',
      out5: 'İSTASYON 5',
      out6: 'İSTASYON 6',
      park: 'PARK',
    }

    return paramDescriptions[param] || param
  }

  const renderExtensionButton = (button) => {
    if (isPressed[button]) {
      return (
        <div className={styles.extensionButtonWrapper}>
          <Button
            disabled={!isPressed[button]}
            variant='outlined'
            style={{
              minWidth: 1,
              padding: 1,
              width: '300px',
              height: '70px',
              fontSize: '30px',
            }}
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
        <Logo />
        <div className={styles.refreshButtonContainer}>
          <Button
            style={{ width: '300px', height: '70px', fontSize: '30px' }}
            variant='outlined'
            onClick={refreshPage}
          >
            YENİLE
          </Button>
        </div>
        <h1
          className={styles.refreshButtonContainer}
          style={{ color: '#1976D2', fontSize: '30px' }}
        >
          {handleCurrentParam(param)}
        </h1>
        <BatteryStatus level={battery} />
        <ToastContainer />
        <div className={styles.container}>
          <h1 style={{ color: '#1976D2' }}>
            {ros.isConnected ? (
              'Bağlandı'
            ) : (
              <Button onClick={connect} style={{ fontSize: '30px' }}>
                Bağlan
              </Button>
            )}
          </h1>
          <Button onClick={checkConnection}>Bağlantı kontrol et</Button>
        </div>
        <div className={styles.mainButtons}>
          <div className={styles.pickButtons}>
            {['out1', 'out2', 'out3', 'out4', 'out5', 'out6'].map(
              (button, index) => (
                <div key={index} className={styles.pickColumn}>
                  <Button
                    style={{ width: '300px', height: '70px', fontSize: '30px' }}
                    className={styles.pickButton}
                    variant={isPressed[button] ? 'contained' : 'outlined'}
                    onClick={() => handleButtonClick(button)}
                  >
                    İstasyon {index + 1}
                  </Button>
                  {renderExtensionButton(button)}
                </div>
              )
            )}
          </div>
          <div className={styles.parkButtonContainer}>
            <Button
              style={{ width: '300px', height: '70px', fontSize: '30px' }}
              variant={isPressed.park ? 'contained' : 'outlined'}
              onClick={() => handleButtonClick('park')}
            >
              Park
            </Button>
            {renderExtensionButton('park')}
          </div>
        </div>
      </div>
    </>
  )
}

export default Home
