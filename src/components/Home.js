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
    connect()
    return () => {
      // Cleanup WebSocket if needed
      if (wsClient) wsClient.close()
    }
  }, [])

  // Connect to the WebSocket server
  function connect() {
    try {
      const ws = new WebSocket(`ws://${WS_SERVER_IP}:${WS_SERVER_PORT}/react`);
  
      ws.onopen = () => {
        console.log('Connected to WebSocket server!');
        // toast message "Connected to WebSocket server!" should be in the top middle
        toast.success('Connected to WebSocket server!',{
          position: "top-center",
          autoClose: 300,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          // transition: Bounce,
        });

        setWsClient(ws);
      };
  
      ws.onmessage = (event) => {
        // Parse the message
        const message = JSON.parse(event.data);
        setBattery(message.Robot.battery_percentage)
        setRobotName(message.Robot.Name)
        console.log('Message from server:', message);
        // Handle the message from the server (which might come from the robot)
      };
  
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast.error('WebSocket error');
      };
  
      ws.onclose = () => {
        console.log('WebSocket connection closed');
        toast.info('WebSocket connection closed',{
          position: "top-center",
          autoClose: 300,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          // transition: Bounce,
        });
        setWsClient(null);
      };
    } catch (error) {
      console.error(error);
    }
  }


  function checkConnection() {
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      toast.success('Robot is Connected',{
        position: "top-center",
        autoClose: 300,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        // transition: Bounce,
      })
    } else {
      toast.error('Robot is not Connected',{
        position: "top-center",
        autoClose: 300,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        // transition: Bounce,
      })
    }
  }

  const handleButtonClick = (button) => {
    if (battery > 1 && battery < 20) {
      toast.error('Battery level is too low, Robot is going to parking...');
      handleParam('park');
      return;
    }
    setIsPressed((prevState) => {
      // Reset all buttons to false
      const newState = {
        out1: false,
        out2: false,
        out3: false,
        out4: false,
        out5: false,
        out6: false,
        park: false,
      };
      // Toggle the selected button: if it was not active, activate it.
      if (!prevState[button]) {
        newState[button] = true;
      }
      return newState;
    });
  };
  

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
              width: '150px',
              height: '50px',
              fontSize: '10px',
              fontWeight: 'bold',
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
            style={{ width: '150px', height: '50px', fontSize: '10px', fontWeight: 'bold' }}
            variant='outlined'
            onClick={refreshPage}
          >
            YENİLE
          </Button>
          {/* <Button>{robotName}</Button> */}
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
              onClick={() => handleParam('')}
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
        <div className={styles.mainButtons}>
          <div className={styles.pickButtons}>
            {['out1', 'out2', 'out3', 'out4', 'out5', 'out6'].map(
              (button, index) => (
                <div key={index} className={styles.pickColumn}>
                  <Button
                    style={{ width: '150px', height: '50px', fontSize: '10px', fontWeight: 'bold' }}
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
              style={{ width: '150px', height: '50px', fontSize: '10px', fontWeight: 'bold' }}
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
