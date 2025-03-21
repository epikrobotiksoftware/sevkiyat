import React, { useState, useEffect } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Button from '@mui/material/Button'
import BatteryStatus from './BatteryStatus'
import { FaArrowCircleRight } from 'react-icons/fa'
import Logo from './Logo'
import ChargingModal from './ChargingModal' // Import the new component
import styles from './home.module.css'
import logoImage from '../Epik.jpeg'

function Home() {
  const [battery, setBattery] = useState(0)
  const [wsClient, setWsClient] = useState(null)
  const [robotName, setRobotName] = useState('')
  const [autoCharged, setAutoCharged] = useState(false)
  const [pickPressed, setPickPressed] = useState({
    out1: false,
    out2: false,
    out3: false,
    park: false,
    charge: false,
  })
  const [dropPressed, setDropPressed] = useState({
    out1: false,
    out2: false,
    out3: false,
  })
  // const [param, setParam] = useState('None')
  const [param, setParam] = useState({ pick: 'None', drop: 'None' })

  // State for opening the charge modal
  const [openChargeModal, setOpenChargeModal] = useState(false)

  // WebSocket server details
  const WS_SERVER_IP = process.env.REACT_APP_SERVER
  // const WS_SERVER_IP = process.env.REACT_APP_LOCAL
  const WS_SERVER_PORT = '8701'

  useEffect(() => {
    connect()
    return () => {
      if (wsClient) wsClient.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function connect() {
    try {
      const ws = new WebSocket(`ws://${WS_SERVER_IP}:${WS_SERVER_PORT}/react`)
      ws.onopen = () => {
        console.log('Connected to WebSocket server!')
        toast.success('Connected to WebSocket server!', {
          position: 'top-center',
          autoClose: 300,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: 'light',
        })
        setWsClient(ws)
      }
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data)
        console.log(message)

        setBattery(message.Robot.battery_percentage)
      }
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        toast.error('WebSocket error')
      }
      ws.onclose = () => {
        console.log('WebSocket connection closed')
        toast.info('WebSocket connection closed', {
          position: 'top-center',
          autoClose: 300,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: 'light',
        })
        setWsClient(null)
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (battery < 20 && battery > 1 && !autoCharged) {
      console.log('Battery < 20%, auto-charging now...')
      toast.error(
        'Battery level is too low, going to charging automatically...'
      )
      setPickPressed({
        out1: false,
        out2: false,
        out3: false,
        park: false,
        charge: true,
      })
      const message1 = { '/ChargePercentageSelection': 100 }
      const message2 = { '/ChargeMinuteSelection': 'None' }
      wsClient.send(JSON.stringify(message1))
      wsClient.send(JSON.stringify(message2))
      handleParam('charge', 'pick')
      setAutoCharged(true)
    }
    if (battery >= 20 && autoCharged) {
      setAutoCharged(false)
    }
  }, [battery, autoCharged])

  function checkConnection() {
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      toast.success('Robot is Connected', {
        position: 'top-center',
        autoClose: 300,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
    } else {
      toast.error('Robot is not Connected', {
        position: 'top-center',
        autoClose: 300,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
    }
  }

  const handlePickButtonClick = (button) => {
    if (button === 'charge') {
      setOpenChargeModal(true)
      return
    }
    if (battery > 1 && battery < 20 && button !== 'charge') {
      toast.error('Battery level is too low, Robot is going to charging...')
      setPickPressed({
        out1: false,
        out2: false,
        out3: false,
        park: false,
        charge: true,
      })
      handleParam('charge', 'pick')
      return
    }
    setPickPressed({
      out1: false,
      out2: false,
      out3: false,
      park: false,
      charge: false,
      [button]: true,
    })
  }

  const handleDropButtonClick = (button) => {
    if (battery > 1 && battery < 20) {
      toast.error('Battery level is too low, Robot is going to charging ...')
      setPickPressed({
        out1: false,
        out2: false,
        out3: false,
        park: false,
        charge: true,
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

  const handlePickFooterButtonClick = (button) => {
    setPickPressed((prev) => ({
      ...prev,
      park: false,
      charge: false,
      [button]: true,
    }))
  }

  const handleParam = (button, group) => {
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      let message
      let label = ''

      if (group === 'drop') {
        // Generate the Drop{number} format
        label = `Drop${button.replace('out', '')}`
        message = { '/drop_selection': button }
        setParam((prev) => ({ ...prev, drop: label }))
      } else if (group === 'pick') {
        // Generate the Pick{number} format
        label = button === 'park' ? 'Park' : `Pick${button.replace('out', '')}`
        message = { '/pick_selection': button }
        setParam((prev) => ({ ...prev, pick: label }))
      } else if (group === 'None') {
        const message1 = { '/pick_selection': button }
        const message2 = { '/drop_selection': button }
        const message3 = { '/navigation_cancel': 'stop' }
        wsClient.send(JSON.stringify(message1))
        wsClient.send(JSON.stringify(message2))
        wsClient.send(JSON.stringify(message3))
        setParam({ pick: 'None', drop: 'None' })
        return
      }
      console.log(JSON.stringify(message))

      // Send the message to the WebSocket server
      wsClient.send(JSON.stringify(message))
    } else {
      console.error('WebSocket not connected')
      toast.error('WebSocket not connected')
    }
  }

  function refreshPage() {
    window.location.reload()
  }

  function handleCurrentParam(param) {
    const { pick, drop } = param

    if (pick !== 'None' && drop !== 'None') {
      return `${pick} -> ${drop}`
    } else if (pick !== 'None') {
      return `${pick} -> Seçim Bekleniyor`
    } else if (drop !== 'None') {
      return `Drop: ${drop}`
    }
    return 'None'
  }

  function handleNone(params) {
    setParam('None')
    handleParam('None', 'None')
    if (params === 'pick - park' || params === 'pick - charge') {
      setPickPressed({
        out1: false,
        out2: false,
        out3: false,
        park: false,
        charge: false,
      })
    } else {
      setDropPressed({
        out1: false,
        out2: false,
        out3: false,
      })
    }
  }

  const renderExtensionButton = (group, button) => {
    const isActive =
      group === 'pick' ? pickPressed[button] : dropPressed[button]
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
            style={{
              width: '150px',
              height: '50px',
              fontSize: '10px',
              fontWeight: 'bold',
            }}
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
          {param.pick !== 'None' || param.drop !== 'None'
            ? handleCurrentParam(param)
            : ''}
          <Button
            style={{ marginLeft: '10px', fontSize: '10px' }}
            variant='outlined'
            onClick={() => handleNone(param)}
          >
            {param.pick === 'None' && param.drop === 'None'
              ? 'Durdur'
              : 'İptal Et'}
          </Button>
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
            {['out1', 'out2', 'out3'].map((button, index) => (
              <div key={index} className={styles.pickColumn}>
                <Button
                  style={{
                    width: '150px',
                    height: '50px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                  }}
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
          <div className={styles.dropButtons}>
            {['out1', 'out2', 'out3'].map((button, index) => (
              <div key={index} className={styles.pickColumn}>
                <Button
                  style={{
                    width: '150px',
                    height: '50px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                  }}
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
        {/* Add this section below */}
        <div className={styles.footerLogo}>
          <span style={{ fontSize: '12px', marginRight: '5px' }}>
            Powered by
          </span>
          <img src={logoImage} alt='Logo' style={{ height: '30px' }} />
        </div>
      </div>
      {/* Use the extracted ChargingModal component */}
      <ChargingModal
        open={openChargeModal}
        onClose={() => setOpenChargeModal(false)}
        wsClient={wsClient}
        onSubmit={(param) => {
          setParam({ pick: param, drop: '' })
          setPickPressed({
            out1: false,
            out2: false,
            out3: false,
            park: false,
            charge: true,
          })
        }}
      />
    </>
  )
}

export default Home
