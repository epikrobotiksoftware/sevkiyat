import React, { useState, useEffect, useRef } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Button from '@mui/material/Button'
import BatteryStatus from './BatteryStatus'
import { FaArrowCircleUp, FaArrowCircleDown } from 'react-icons/fa'
import Logo from './Logo'
import ChargingModal from './ChargingModal'
import styles from './home.module.css'
import logoImage from '../Epik.jpeg'
import MapImage from '../assets/map.png'
import Joystick from './Joystick'
import { BsJoystick } from 'react-icons/bs'
import { PiProhibit } from 'react-icons/pi'

function Home() {
  // Basic states
  const [battery, setBattery] = useState(0)
  const [chargingStatus, setChargingStatus] = useState(0)
  const [wsClient, setWsClient] = useState(null)
  const [autoCharged, setAutoCharged] = useState(false)
  const reconnectInterval = useRef(1000) // Initial reconnect interval
  const reconnectTimer = useRef(null)

  // Dynamic station selection states
  const [pickStation, setPickStation] = useState(null)
  const [dropStation, setDropStation] = useState(null)
  const [activeStation, setActiveStation] = useState(null)

  // Charging modal state
  const [openChargeModal, setOpenChargeModal] = useState(false)

  // Joystick enabled state
  const [joystickEnabled, setJoystickEnabled] = useState(false)

  // WebSocket server details
  const WS_SERVER_IP = process.env.REACT_APP_SERVER
  const WS_SERVER_PORT = '8701'

  useEffect(() => {
    connect()
    return () => {
      if (wsClient) wsClient.close()
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function connect() {
    const ws = new WebSocket(`ws://${WS_SERVER_IP}:${WS_SERVER_PORT}/react`)

    ws.onopen = () => {
      console.log('Connected to WebSocket server!')
      toast.success('Connected to WebSocket server!', {
        position: 'top-center',
        autoClose: 300,
      })
      setWsClient(ws)
      reconnectInterval.current = 1000 // Reset interval upon successful connection
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    }

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.Robot) {
        setBattery(message.Robot.battery_percentage || 0)
        setChargingStatus(message.Robot.battery_status)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      toast.error('WebSocket error')
    }

    ws.onclose = () => {
      console.log('WebSocket connection closed')
      setBattery(0)
      setWsClient(null)
      attemptReconnect()
    }
  }

  function attemptReconnect() {
    reconnectTimer.current = setTimeout(() => {
      console.log('Attempting to reconnect...')
      connect()
      reconnectInterval.current = Math.min(reconnectInterval.current * 2, 30000) // max 30 sec
    }, reconnectInterval.current)
  }

  // Auto-charge if battery is low
  useEffect(() => {
    if (battery < 20 && battery > 1 && !autoCharged) {
      console.log('Battery < 20%, auto-charging now...')
      toast.error(
        'Battery level is too low, going to charging automatically...'
      )
      setPickStation('charge')
      const message1 = { type: 'param', '/ChargePercentageSelection': 100 }
      const message2 = { type: 'param', '/ChargeMinuteSelection': 'None' }
      wsClient.send(JSON.stringify(message1))
      wsClient.send(JSON.stringify(message2))
      handleParam('charge', 'pick')
      setAutoCharged(true)
    }
    if (battery >= 20 && autoCharged) {
      setAutoCharged(false)
    }
  }, [battery, autoCharged, wsClient])

  // Send appropriate WebSocket message for pick/drop/cancellation
  const handleParam = (station, group) => {
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      let message = {}
      if (group === 'drop') {
        message = { type: 'param', '/drop_selection': station }
      } else if (group === 'pick') {
        message = { type: 'param', '/pick_selection': station }
      } else if (group === 'None') {
        const message1 = { type: 'param', '/pick_selection': station }
        const message2 = { type: 'param', '/drop_selection': station }
        const message3 = { type: 'param', '/navigation_cancel': 'stop' }
        wsClient.send(JSON.stringify(message1))
        wsClient.send(JSON.stringify(message2))
        wsClient.send(JSON.stringify(message3))
        return
      }
      console.log(JSON.stringify(message))
      wsClient.send(JSON.stringify(message))
    } else {
      console.error('WebSocket not connected')
      toast.error('WebSocket not connected')
    }
  }

  // Handle a station button click – shows extension options
  const handleStationClick = (station) => {
    if (station === 'charge') {
      setOpenChargeModal(true)
      return
    }
    if (battery > 1 && battery < 20 && station !== 'charge') {
      toast.error('Battery level is too low, Robot is going to charging...')
      setPickStation('charge')
      handleParam('charge', 'pick')
      return
    }
    setActiveStation(station)
  }

  // When user selects an action (pick or drop) for the active station
  const handleSelection = (station, action) => {
    if (action === 'pick') {
      if (dropStation && station === dropStation) {
        toast.error('Pick and drop stations cannot be the same.')
        return
      }
      setPickStation(station)
      handleParam(station, 'pick')
    } else if (action === 'drop') {
      if (pickStation && station === pickStation) {
        toast.error('Pick and drop stations cannot be the same.')
        return
      }
      setDropStation(station)
      handleParam(station, 'drop')
    }
    setActiveStation(null)
  }

  // Reset selection (cancel)
  const handleCancel = () => {
    setPickStation(null)
    setDropStation(null)
    setActiveStation(null)
    handleParam('None', 'None')
  }

  // Display the current selection state
  const renderStationStatus = () => {
    if (!pickStation) {
      return 'Awaiting pick station selection'
    } else if (!dropStation) {
      return `Pick: ${pickStation} → Awaiting drop station selection`
    } else {
      return `Pick: ${pickStation} → Drop: ${dropStation}`
    }
  }

  // Define stations
  const mainStations = ['out1', 'out2', 'out3', 'out4', 'out5', 'out6']
  const footerStations = ['park', 'charge']

  return (
    <div className={styles.mainContainer}>
      <div className={styles.contentWrapper}>
        <Logo />
        <div className={styles.refreshButtonContainer}>
          <Button
            style={{
              width: '150px',
              height: '50px',
              fontSize: '10px',
              fontWeight: 'bold',
            }}
            variant='outlined'
            onClick={() => window.location.reload()}
          >
            YENİLE
          </Button>
          <Button
            style={{
              width: '150px',
              height: '50px',
              fontSize: '10px',
              fontWeight: 'bold',
              marginLeft: '10px',
            }}
            variant='outlined'
            onClick={() => setJoystickEnabled((prev) => !prev)}
          >
            {joystickEnabled ? (
              <PiProhibit size={25} color='red' />
            ) : (
              <BsJoystick size={25} />
            )}
          </Button>
        </div>
        <h1
          className={styles.refreshButtonContainer}
          style={{ color: '#1976D2', fontSize: '17px', marginTop: '15px' }}
        >
          {(pickStation || dropStation) && renderStationStatus()}
          <Button
            style={{ marginLeft: '10px', fontSize: '10px' }}
            variant='outlined'
            onClick={handleCancel}
          >
            {pickStation || dropStation ? 'İptal Et' : 'Durdur'}
          </Button>
        </h1>
        <BatteryStatus level={battery} chargingStatus={chargingStatus} />
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
          <Button onClick={() => {}}>Bağlantı kontrolu</Button>
        </div>
        {/* Main station buttons */}
        <div className={styles.stationContainer}>
          {mainStations.map((station, index) => (
            <div key={index} className={styles.stationButtonWrapper}>
              <Button
                style={{
                  width: '150px',
                  height: '50px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                }}
                variant={
                  station === pickStation || station === dropStation
                    ? 'contained'
                    : 'outlined'
                }
                onClick={() => handleStationClick(station)}
              >
                {`Station ${station.replace('out', '')}`}
              </Button>
              {activeStation === station && (
                <div className={styles.extensionButtonWrapper}>
                  <Button
                    variant='outlined'
                    style={{
                      minWidth: 1,
                      padding: 1,
                      width: '70px',
                      height: '50px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                    }}
                    onClick={() => handleSelection(station, 'pick')}
                  >
                    <FaArrowCircleUp style={{ fontSize: '2.3em' }} />
                  </Button>
                  <Button
                    variant='outlined'
                    style={{
                      minWidth: 1,
                      padding: 1,
                      width: '70px',
                      height: '50px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                    }}
                    onClick={() => handleSelection(station, 'drop')}
                  >
                    <FaArrowCircleDown style={{ fontSize: '2.3em' }} />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Map image */}
        <div className={styles.mapContainer}>
          <img src={MapImage} alt='Station Map' className={styles.mapImage} />
        </div>
        {/* Footer buttons */}
        <div className={styles.footer}>
          {footerStations.map((station, index) => (
            <div key={index} className={styles.footerButtonContainer}>
              <Button
                style={{
                  width: '150px',
                  height: '50px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                }}
                variant={
                  station === pickStation || station === dropStation
                    ? 'contained'
                    : 'outlined'
                }
                onClick={() => handleStationClick(station)}
              >
                {station.charAt(0).toUpperCase() + station.slice(1)}
              </Button>
              {activeStation === station && (
                <div className={styles.extensionButtonWrapper}>
                  <Button
                    variant='outlined'
                    style={{
                      minWidth: 1,
                      padding: 1,
                      width: '70px',
                      height: '50px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                    }}
                    onClick={() => handleSelection(station, 'pick')}
                  >
                    <FaArrowCircleUp style={{ fontSize: '2.3em' }} />
                  </Button>
                  {station !== 'park' && (
                    <Button
                      variant='outlined'
                      style={{
                        minWidth: 1,
                        padding: 1,
                        width: '70px',
                        height: '50px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                      }}
                      onClick={() => handleSelection(station, 'drop')}
                    >
                      <FaArrowCircleDown style={{ fontSize: '2.3em' }} />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Logo */}
      <div className={styles.footerLogo}>
        <span style={{ fontSize: '12px', marginRight: '5px' }}>Powered by</span>
        <img src={logoImage} alt='Logo' style={{ height: '30px' }} />
      </div>

      {/* Charging modal */}
      <ChargingModal
        open={openChargeModal}
        onClose={() => setOpenChargeModal(false)}
        wsClient={wsClient}
        onSubmit={(param) => {
          setPickStation('charge')
        }}
      />

      {/* Conditionally render the joystick when enabled */}
      {joystickEnabled && <Joystick wsClient={wsClient} />}
    </div>
  )
}

export default Home
