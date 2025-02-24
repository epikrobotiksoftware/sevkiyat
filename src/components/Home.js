import React, { useState, useEffect } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Button from '@mui/material/Button'
import BatteryStatus from './BatteryStatus'
import { FaArrowCircleRight } from 'react-icons/fa'
import Logo from './Logo'
import styles from './home.module.css'

function Home() {
  const [battery, setBattery] = useState(0)
  const [wsClient, setWsClient] = useState(null)
  const [isPressed, setIsPressed] = useState({
    out1: false,
    out2: false,
    out3: false,
    out4: false,
    out5: false,
    out6: false,
    park: false,
  })
  const [param, setParam] = useState(false)

  // WebSocket server details
  const WS_SERVER_IP = '192.168.3.146'
  const WS_SERVER_PORT = '8701'

  useEffect(() => {
    // getBattery()
    // Optionally, you can connect automatically on mount:
    connect()
    return () => {
      // Cleanup WebSocket if needed
      if (wsClient) wsClient.close()
    }
  }, [])

  // Connect to the WebSocket server
  function connect() {
    try {
      const ws = new WebSocket(`ws://${WS_SERVER_IP}:${WS_SERVER_PORT}`)

      ws.onopen = () => {
        console.log('Connected to WebSocket server!')
        toast.success('Connected to WebSocket server!')
        ws.send(JSON.stringify({ clientType: 'ui' }))
        setWsClient(ws)
      }

      ws.onmessage = (event) => {
        console.log('Message from server:', event.data)
        // Optionally handle incoming messages here.
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        toast.error('WebSocket error')
      }

      ws.onclose = () => {
        console.log('WebSocket connection closed')
        toast.info('WebSocket connection closed')
        setWsClient(null)
      }
    } catch (error) {
      console.error(error)
    }
  }

  // async function getBattery() {
  //   try {
  //     const headers = {
  //       Authorization: `Bearer ${token}`,
  //       'Content-Type': 'application/json',
  //     }
  //     console.log('Request headers:', headers)
  //     const res = await axios.post(
  //       'https://192.168.3.146/api/v1/function/amr_mini_fleetBattery_cb/',
  //       { func: 'battery' },
  //       { headers }
  //     )
  //     const batteryFromAPI = res.data.message
  //     setBattery(Math.round(batteryFromAPI))
  //   } catch (error) {
  //     console.error(error)
  //   }
  // }

  function checkConnection() {
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      toast.success('Robot is Connected')
    } else {
      toast.error('Robot is not Connected')
    }
  }

  const handleButtonClick = (button) => {
    if (battery > 1 && battery < 20) {
      toast.error('Battery level is too low, Robot is going to parking...')
      handleParam('park')
      return
    }
    setIsPressed((prevState) => ({
      ...prevState,
      [button]: !prevState[button],
    }))
  }

  // Send the parameter via the WebSocket connection
  const handleParam = (button) => {
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      const message = { param: button }
      wsClient.send(JSON.stringify(message))
      setParam(button)
    } else {
      console.error('WebSocket not connected')
      toast.error('WebSocket not connected')
    }
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
          {param && (
            <Button
              style={{ marginLeft: '10px', fontSize: '20px' }}
              variant='outlined'
              onClick={() => handleParam('')}
            >
              İptal Et
            </Button>
          )}
        </h1>
        <BatteryStatus level={battery} />
        <ToastContainer />
        <div className={styles.container}>
          <h1 style={{ color: '#1976D2' }}>
            {wsClient && wsClient.readyState === WebSocket.OPEN ? (
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
