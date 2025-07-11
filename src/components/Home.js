import React, { useState, useEffect, useRef } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Button from '@mui/material/Button'
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
  console.log(SERVER);
  
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
      console.log('WebSocket sunucusuna bağlandı!')
      toast.success('WebSocket sunucusuna bağlandı!', {
        position: 'top-center',
        autoClose: 300,
      })
      setWsClient(ws)
      reconnectInterval.current = 1000 // Başarılı bağlantıda süreyi sıfırla
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    }

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.Robot) {
        setBattery(message.Robot.battery_percentage || 0)
        setChargingStatus(message.Robot.battery_status)
      }
      if (message.type === 'map-updated') {
        setMapSrc(`${SERVER}/map.png?ts=${message.ts}`)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket hatası:', error)
      toast.error('WebSocket hatası')
    }

    ws.onclose = () => {
      console.log('WebSocket bağlantısı kesildi')
      setBattery(0)
      setWsClient(null)
      attemptReconnect()
    }
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }


  function attemptReconnect() {
    reconnectTimer.current = setTimeout(() => {
      console.log('Yeniden bağlanılıyor...')
      connect()
      reconnectInterval.current = Math.min(reconnectInterval.current * 2, 30000) // Maksimum 30 sn
    }, reconnectInterval.current)
  }

  // Pil seviyesi düşükse otomatik şarj
  useEffect(() => {
    if (battery < 20 && battery > 1 && !autoCharged) {
      console.log('Pil %20’nin altında, otomatik şarj başlatılıyor...')
      toast.error('Pil seviyesi çok düşük, otomatik şarj moduna geçiliyor...')
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

  // WebSocket mesajı gönderme (alım, bırak, iptal)
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
      console.error('WebSocket bağlı değil')
      toast.error('WebSocket bağlı değil')
    }
  }

  // İstasyon butonuna tıklama – ek seçenekleri gösterir
  const handleStationClick = (station) => {
    if (station === 'charge') {
      setOpenChargeModal(true)
      return
    }
    if (battery > 1 && battery < 20 && station !== 'charge') {
      toast.error('Pil seviyesi çok düşük, robot şarj moduna geçiyor...')
      setPickStation('charge')
      handleParam('charge', 'pick')
      return
    }
    setActiveStation(station)
  }

  // Aktif istasyon için kullanıcının yaptığı seçim (alım veya bırak)
  const handleSelection = (station, action) => {
    if (action === 'pick') {
      if (dropStation && station === dropStation) {
        toast.error('Al ve bırak istasyonları aynı olamaz.')
        return
      }
      setPickStation(station)
      handleParam(station, 'pick')
    } else if (action === 'drop') {
      if (pickStation && station === pickStation) {
        toast.error('Al ve bırak istasyonları aynı olamaz.')
        return
      }
      setDropStation(station)
      handleParam(station, 'drop')
    }
    setActiveStation(null)
  }

  // Seçimi sıfırlama (iptal)
  const handleCancel = () => {
    setPickStation(null)
    setDropStation(null)
    setActiveStation(null)
    handleParam('None', 'None')
  }

  // Seçim durumunu gösterir
  const renderStationStatus = () => {
    if (!pickStation) {
      return 'Alım istasyonu seçimi bekleniyor'
    } else if (!dropStation) {
      return `Al: ${getDisplayName(
        pickStation
      )} → Bırakma istasyonu seçimi bekleniyor`
    } else {
      return `Al: ${getDisplayName(pickStation)} → Bırak: ${getDisplayName(
        dropStation
      )}`
    }
  }

  // İstasyonlar:
  // Main station değerleri WebSocket ile gönderilmek üzere "out1", "out2", ... şeklinde.
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
          <MapCanvas src={mapSrc} />
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
        onSubmit={(param) => {
          setPickStation('charge')
        }}
      />

      {/* Joystick, etkinse render edilir */}
      {joystickEnabled &&
        (isMobile ? (
          <MobileJoystick
            wsClient={wsClient}
            onExit={() => setJoystickEnabled(false)}
          />
        ) : (
          <Joystick wsClient={wsClient} />
        ))}
    </div>
  )
}

export default Home
