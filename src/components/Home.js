import React, { useState, useEffect, useRef } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import BatteryStatus from './BatteryStatus'
import {
  FaArrowCircleUp,
  FaArrowCircleDown,
  FaArrowCircleRight,
} from 'react-icons/fa'
import Logo from './Logo'
import ChargingModal from './ChargingModal'
import styles from './home.module.css'
import logoImage from '../Epik.jpeg'
import Joystick from './Joystick'
import { BsJoystick } from 'react-icons/bs'
import { PiProhibit } from 'react-icons/pi'
import { HiRefresh } from 'react-icons/hi'
import { isMobile } from 'react-device-detect'
import MobileJoystick from './MobileJoystick'
import MapCanvas from './MapCanvas'

function Home() {
  // Basic states
  // const SERVER =  process.env.REACT_APP_SERVER +':'+ process.env.REACT_APP_PORT
  const SERVER =  `http://${process.env.REACT_APP_SERVER}:8701`
  const [robotsList, setRobotsList] = useState([])           // all robots from WS
  const [selectedRobot, setSelectedRobot] = useState(null)   // the one the user picks
  const [anchorElRobot, setAnchorElRobot] = useState(null)   // for MUI menu
  
  const [battery, setBattery] = useState(0)
  const [chargingStatus, setChargingStatus] = useState(0)
  const [wsClient, setWsClient] = useState(null)
  const [autoCharged, setAutoCharged] = useState(false)
  const reconnectInterval = useRef(1000) // İlk yeniden bağlanma süresi
  const reconnectTimer = useRef(null)
  const [rotation, setRotation] = useState(0)

  // Dynamic station selection states
  const [pickStation, setPickStation] = useState(null)
  const [dropStation, setDropStation] = useState(null)
  const [activeStation, setActiveStation] = useState(null)
  const [mapSrc, setMapSrc] = useState(`${SERVER}/map.png`)

  // Charging modal state
  const [openChargeModal, setOpenChargeModal] = useState(false)

  // Joystick enabled state
  const [joystickEnabled, setJoystickEnabled] = useState(false)

  // WebSocket server details
  const WS_SERVER_IP = process.env.REACT_APP_SERVER
  const WS_SERVER_PORT = '8701'

  // Helper: transforms internal station codes to user-facing names.
  // For main stations, "out[number]" becomes "İstasyon [number]".
  // For footer stations, "charge" becomes "Şarj" and "park" becomes "Park".
  const getDisplayName = (station) => {
    if (!station) return ''
    if (station.startsWith('out')) {
      return `İstasyon ${station.replace('out', '')}`
    } else if (station === 'charge') {
      return 'Şarj'
    } else if (station === 'park') {
      return 'Park'
    }
    return station
  }

  const handleRobotMenuOpen = (e) => setAnchorElRobot(e.currentTarget)
  const handleRobotMenuClose = () => setAnchorElRobot(null)
  const handleRobotSelect = (name) => {
    setSelectedRobot(name)
    setAnchorElRobot(null)
  }

  useEffect(() => {
    if (!selectedRobot && robotsList.length > 0) {
      setSelectedRobot(null)
    }
    const sel = robotsList.find(r => r.Name === selectedRobot)
    if (sel) {
      setBattery(sel.battery_percentage || 0)
      setChargingStatus(sel.battery_status)
    }
  }, [robotsList, selectedRobot])

  useEffect(() => {
    if (robotsList.length === 0) {
      setSelectedRobot(null)
      setBattery(0)
      setChargingStatus(0)
    }
  }, [robotsList])

  useEffect(() => {
    connect()
    return () => {
      wsClient?.close()
      reconnectTimer.current && clearTimeout(reconnectTimer.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function connect() {
    const ws = new WebSocket(`ws://${WS_SERVER_IP}:${WS_SERVER_PORT}/react`)
    ws.onopen = () => {
      console.log('WebSocket connected')
      toast.success('WebSocket’e bağlandı!', { position: 'top-center', autoClose: 300 })
      setWsClient(ws)
      reconnectInterval.current = 1000
      reconnectTimer.current && clearTimeout(reconnectTimer.current)
    }
    ws.onmessage = ({ data }) => {
      const msg = JSON.parse(data)
      // console.log(msg);
      

      switch (msg.type) {
        case 'robots':
          // Deduped list comes in msg.payload
          setRobotsList(msg.payload)
          break

        case 'map-updated':
          setMapSrc(`${SERVER}/map.png?ts=${msg.ts}`)
          break

        default:
          console.warn('Unhandled WS message:', msg)
      }
    }
    ws.onerror = (err) => {
      console.error('WebSocket error', err)
      toast.error('WebSocket hatası')
    }
    ws.onclose = () => {
      console.log('WebSocket disconnected')
      setWsClient(null)
      setBattery(0)
      attemptReconnect()
    }
  }



  function attemptReconnect() {
    reconnectTimer.current = setTimeout(() => {
      console.log('Reconnecting…')
      connect()
      reconnectInterval.current = Math.min(reconnectInterval.current * 2, 30000)
    }, reconnectInterval.current)
  }

  // Pil seviyesi düşükse otomatik şarj
  useEffect(() => {
    if (!selectedRobot || !wsClient) return
    if (battery < 20 && battery > 1 && !autoCharged) {
      toast.error('Pil çok düşük, otomatik şarj moduna geçiliyor…')
      setPickStation('charge')
      const msg1 = { type: 'param', '/ChargePercentageSelection': 100, robotName: selectedRobot }
      const msg2 = { type: 'param', '/ChargeMinuteSelection': 'None',   robotName: selectedRobot }
      wsClient.send(JSON.stringify(msg1))
      wsClient.send(JSON.stringify(msg2))
      setAutoCharged(true)
    }
    if (battery >= 20 && autoCharged) {
      setAutoCharged(false)
    }
  }, [battery, autoCharged, wsClient, selectedRobot])

  // WebSocket mesajı gönderme (alım, bırak, iptal)
  const handleParam = (station, group) => {
    if (!wsClient || wsClient.readyState !== WebSocket.OPEN) {
      toast.error('WebSocket bağlı değil')
      return
    }
    let msgs = []
    if (group === 'pick') {
      msgs.push({ type: 'param', '/pick_selection': station, robotName: selectedRobot })
    } else if (group === 'drop') {
      msgs.push({ type: 'param', '/drop_selection': station, robotName: selectedRobot })
    } else if (group === 'None') {
      msgs.push(
        { type: 'param', '/pick_selection': station,       robotName: selectedRobot },
        { type: 'param', '/drop_selection': station,       robotName: selectedRobot },
        { type: 'param', '/navigation_cancel': 'stop',     robotName: selectedRobot }
      )
    }
    msgs.forEach(m => wsClient.send(JSON.stringify(m)))
  }

  // İstasyon butonuna tıklama – ek seçenekleri gösterir
  const handleStationClick = (station) => {
    if (station === 'charge') { setOpenChargeModal(true); return }
    if (battery < 20 && station !== 'charge') {
      toast.error('Pil çok düşük, şarj moduna geçiliyor…')
      setPickStation('charge')
      handleParam('charge', 'pick')
      return
    }
    setActiveStation(station)
  }

  // Aktif istasyon için kullanıcının yaptığı seçim (alım veya bırak)
  const handleSelection = (station, action) => {
    if (action === 'pick' && dropStation === station) {
      return toast.error('Al ve bırak aynı olamaz.')
    }
    if (action === 'drop' && pickStation === station) {
      return toast.error('Al ve bırak aynı olamaz.')
    }
    action === 'pick' ? setPickStation(station) : setDropStation(station)
    handleParam(station, action)
    setActiveStation(null)
  }
  const handleCancel = () => {
    setPickStation(null); setDropStation(null); setActiveStation(null)
    handleParam('None', 'None')
  }
  const renderStationStatus = () => {
    if (!pickStation) return 'Alım istasyonu seçimi bekleniyor'
    if (!dropStation) return `Al: ${pickStation} → Bırakma bekleniyor`
    return `Al: ${pickStation} → Bırak: ${dropStation}`
  }

  // İstasyonlar:
  // Main station değerleri WebSocket ile gönderilmek üzere "out1", "out2", ... şeklinde.
  const handleRotate = () => setRotation(r => (r + 90) % 360)
  // Ancak kullanıcıya "İstasyon 1", "İstasyon 2", ... olarak görünecek.
  const mainStations = ['out1', 'out2', 'out3', 'out4', 'out5', 'out6']
  // Footer istasyonları, "park" ve "charge"
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
            <HiRefresh size={25} />
          </Button>
          <Button
            variant="outlined"
            onClick={handleRobotMenuOpen}
            style={{ marginRight: 8, marginLeft:18 }}
            disabled={robotsList.length === 0}
          >
            {robotsList.length === 0
              ? 'Robot Seç'                            // no robots → always default
              : selectedRobot                          // otherwise, show selection
                ? `${selectedRobot} (${battery}%)`
                : 'Robot Seç'
            }
          </Button>
          <Menu
            anchorEl={anchorElRobot}
            open={Boolean(anchorElRobot)}
            onClose={handleRobotMenuClose}
          >
            {robotsList.map(r => (
              <MenuItem
                key={r.Name}
                onClick={() => handleRobotSelect(r.Name)}
              >
                {r.Name} — {r.battery_percentage}%
              </MenuItem>
            ))}
          </Menu>
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
          <Button onClick={() => {}}>Bağlantı kontrolü</Button>
        </div>
        {/* Ana istasyon butonları */}
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
                {getDisplayName(station)}
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
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      <FaArrowCircleUp style={{ fontSize: '2.3em' }} />
                      <span style={{ fontSize: '10px' }}>AL</span>
                    </div>
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
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      <FaArrowCircleDown style={{ fontSize: '2.3em' }} />
                      <span style={{ fontSize: '10px' }}>BIRAK</span>
                    </div>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Harita resmi */}
                {/* Alt kısım butonları */}
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
                {getDisplayName(station)}
              </Button>
              {activeStation === station && (
                <div className={styles.extensionButtonWrapper}>
                  {station === 'park' ? (
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
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                        }}
                      >
                        <FaArrowCircleRight style={{ fontSize: '2.3em' }} />
                        <span style={{ fontSize: '10px' }}>Git</span>
                      </div>
                    </Button>
                  ) : (
                    <>
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
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                          }}
                        >
                          <FaArrowCircleUp style={{ fontSize: '2.3em' }} />
                          <span style={{ fontSize: '10px' }}>AL</span>
                        </div>
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
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                          }}
                        >
                          <FaArrowCircleDown style={{ fontSize: '2.3em' }} />
                          <span style={{ fontSize: '10px' }}>BIRAK</span>
                        </div>
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
          <MapCanvas src={mapSrc} />

      </div>

      {/* Alt Logo */}
      <div className={styles.footerLogo}>
        <span style={{ fontSize: '12px', marginRight: '5px' }}>Powered by</span>
        <img src={logoImage} alt='Logo' style={{ height: '30px' }} />
      </div>

      {/* Şarj Modal */}
      <ChargingModal
        open={openChargeModal}
        onClose={() => setOpenChargeModal(false)}
        wsClient={wsClient}
        robotName={selectedRobot}
        onSubmit={(param) => {
          setPickStation('charge')
        }}
      />

      {/* Joystick, etkinse render edilir */}
      {joystickEnabled && (
        isMobile
          ? <MobileJoystick wsClient={wsClient} robotName={selectedRobot} onExit={()=>setJoystickEnabled(false)}/>
          : <Joystick        wsClient={wsClient} robotName={selectedRobot}/>
      )}
    </div>
  )
}

export default Home
