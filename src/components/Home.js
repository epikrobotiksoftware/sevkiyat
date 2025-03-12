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
  const [robotName, setRobotName] = useState('')
  // Combined state for pick selection: out1, out2, out3, park, and charge.
  const [pickPressed, setPickPressed] = useState({
    out1: false,
    out2: false,
    out3: false,
    park: false,
    charge: false,
  })
  // State for drop selection: out1, out2, out3.
  const [dropPressed, setDropPressed] = useState({
    out1: false,
    out2: false,
    out3: false,
  })
  // Stores the current selection to display.
  const [param, setParam] = useState('')

  // WebSocket server details
  const WS_SERVER_IP = '192.168.3.146'
  const WS_SERVER_PORT = '8701'

  useEffect(() => {
    connect()
    return () => {
      if (wsClient) wsClient.close()
    }
  }, [])

  // Connect to the WebSocket server
  function connect() {
    try {
      const ws = new WebSocket(`ws://${WS_SERVER_IP}:${WS_SERVER_PORT}/react`)
      ws.onopen = () => {
        console.log('Connected to WebSocket server!')
        toast.success('Connected to WebSocket server!', {
          position: "top-center",
          autoClose: 300,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        })
        setWsClient(ws)
      }
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data)
        setBattery(message.Robot.battery_percentage)
        setRobotName(message.Robot.Name)
        console.log('Message from server:', message)
      }
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        toast.error('WebSocket error')
      }
      ws.onclose = () => {
        console.log('WebSocket connection closed')
        toast.info('WebSocket connection closed', {
          position: "top-center",
          autoClose: 300,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        })
        setWsClient(null)
      }
    } catch (error) {
      console.error(error)
    }
  }

  function checkConnection() {
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      toast.success('Robot is Connected', {
        position: "top-center",
        autoClose: 300,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      })
    } else {
      toast.error('Robot is not Connected', {
        position: "top-center",
        autoClose: 300,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      })
    }
  }

  // For left column pick buttons (out1, out2, out3)
  const handlePickButtonClick = (button) => {
    // If battery is low (and the selection isn’t Park or Charge), force park.
    if (battery > 1 && battery < 20 && button !== 'park' && button !== 'charge') {
      toast.error('Battery level is too low, Robot is going to parking...')
      setPickPressed({
        out1: false,
        out2: false,
        out3: false,
        park: true,
        charge: false,
      })
      return
    }
    // Update the pick state in one call so that only the pressed button is true.
    setPickPressed({
      out1: false,
      out2: false,
      out3: false,
      park: false,
      charge: false,
      [button]: true,
    })
  }
  

  // For right column drop buttons (out1, out2, out3)
  const handleDropButtonClick = (button) => {
    if (battery > 1 && battery < 20) {
      toast.error('Battery level is too low, Robot is going to parking...')
      // Force park selection on the pick side.
      setPickPressed({
        out1: false,
        out2: false,
        out3: false,
        park: true,
        charge: false,
      })
      return
    }
    setDropPressed({
      out1: false,
      out2: false,
      out3: false,
    })
    setDropPressed((prev) => ({ ...prev, [button]: true }))
  }

  // For footer buttons: Park and Charge (now part of pick selections)
  const handlePickFooterButtonClick = (button) => {
    // Simply update the pick state.
    setPickPressed((prev) => ({ ...prev, park: false, charge: false, [button]: true }))
  }

  // The extension (arrow) button sends the selection to the server.
  const handleParam = (button, group) => {
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      console.log('Sending message:', button)
      let message
      if (group === 'drop') {
        message = { '/drop_selection': button }
      } else { // group 'pick'
        message = { '/pick_selection': button }
      }
      wsClient.send(JSON.stringify(message))
      setParam(`${group} - ${button}`)
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
      "pick - out1": 'Pick 1',
      "pick - out2": 'Pick 2',
      "pick - out3": 'Pick 3',
      "pick - park": 'Park',
      "pick - charge": 'Charge',
      "drop - out1": 'Drop 1',
      "drop - out2": 'Drop 2',
      "drop - out3": 'Drop 3',
    }
    return paramDescriptions[param] || param
  }

  // Renders the extended arrow button only if the corresponding button is active.
  // When clicked, it sends the selection.
  const renderExtensionButton = (group, button) => {
    const isActive = group === 'pick' ? pickPressed[button] : dropPressed[button]
    if (isActive) {
      return (
        <div className={styles.extensionButtonWrapper}>
          <Button
            disabled={!isActive}
            variant='outlined'
            style={{
              minWidth: 1,
              padding: 1,
              width: '150px',
              height: '50px',
              fontSize: '10px',
              fontWeight: 'bold',
            }}
            onClick={() => handleParam(button, group)}
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
            style={{ width: '150px', height: '50px', fontSize: '10px', fontWeight: 'bold' }}
            variant='outlined'
            onClick={refreshPage}
          >
            YENİLE
          </Button>
        </div>
        <h1
          className={styles.refreshButtonContainer}
          style={{ color: '#1976D2', fontSize: '17px', marginTop: '15px' }}
        >
          {handleCurrentParam(param)}
          {param && (
            <Button
              style={{ marginLeft: '10px', fontSize: '10px' }}
              variant='outlined'
              onClick={() => setParam('')}
            >
              İptal Et
            </Button>
          )}
        </h1>
        <BatteryStatus level={battery} />
        <ToastContainer />
        <div className={styles.container}>
          <h2 style={{ color: '#1976D2' }}>
            {wsClient && wsClient.readyState === WebSocket.OPEN ? (
              'Bağlandı'
            ) : (
              <Button onClick={connect} style={{ fontSize: '10px' }}>
                Bağlan
              </Button>
            )}
          </h2>
          <Button onClick={checkConnection}>Bağlantı kontrolu</Button>
        </div>
        {/* Main Buttons */}
        <div className={styles.mainButtons}>
          {/* Left Column: Pick Buttons */}
          <div className={styles.pickButtons}>
            {['out1', 'out2', 'out3'].map((button, index) => (
              <div key={index} className={styles.pickColumn}>
                <Button
                  style={{ width: '150px', height: '50px', fontSize: '10px', fontWeight: 'bold' }}
                  className={styles.pickButton}
                  variant={pickPressed[button] ? 'contained' : 'outlined'}
                  onClick={() => handlePickButtonClick(button)}
                >
                  {`Pick ${index + 1}`}
                </Button>
                {renderExtensionButton('pick', button)}
              </div>
            ))}
          </div>
          {/* Right Column: Drop Buttons */}
          <div className={styles.dropButtons}>
            {['out1', 'out2', 'out3'].map((button, index) => (
              <div key={index} className={styles.pickColumn}>
                <Button
                  style={{ width: '150px', height: '50px', fontSize: '10px', fontWeight: 'bold' }}
                  className={styles.pickButton}
                  variant={dropPressed[button] ? 'contained' : 'outlined'}
                  onClick={() => handleDropButtonClick(button)}
                >
                  {`Drop ${index + 1}`}
                </Button>
                {renderExtensionButton('drop', button)}
              </div>
            ))}
          </div>
        </div>
        {/* Footer: Park and Charge (treated as pick selections) */}
        <div className={styles.footer}>
          {['park', 'charge'].map((button, index) => (
            <div key={index} className={styles.pickColumn}>
              <Button
                className={styles.footerButton}
                variant={pickPressed[button] ? 'contained' : 'outlined'}
                onClick={() => handlePickButtonClick(button)}
              >
                {button.charAt(0).toUpperCase() + button.slice(1)}
              </Button>
              {renderExtensionButton('pick', button)}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default Home
