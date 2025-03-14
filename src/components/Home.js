import React, { useState, useEffect } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Button from '@mui/material/Button'
import BatteryStatus from './BatteryStatus'
import { FaArrowCircleRight } from 'react-icons/fa'
import Logo from './Logo'
import Modal from '@mui/material/Modal'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'
import styles from './home.module.css'

function Home() {
  const [battery, setBattery] = useState(0)
  const [wsClient, setWsClient] = useState(null)
  const [robotName, setRobotName] = useState('')
  const [autoCharged, setAutoCharged] = useState(false)
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
  const [param, setParam] = useState('None')

  // New state for the charge modal
  const [openChargeModal, setOpenChargeModal] = useState(false)
  const [chargeMode, setChargeMode] = useState('percentage')
  const [chargeValue, setChargeValue] = useState('')

  // Material UI modal style
  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 300,
    backgroundColor: 'white',
    border: '2px solid #000',
    boxShadow: 24,
    padding: '16px',
  }

  // WebSocket server details
  const WS_SERVER_IP = '192.168.3.146'
  const WS_SERVER_PORT = '8701'

  useEffect(() => {
    connect()
    return () => {
      if (wsClient) wsClient.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Connect to the WebSocket server
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
      // Force "charge" selected in pickPressed and send the command immediately
      setPickPressed({
        out1: false,
        out2: false,
        out3: false,
        park: false,
        charge: true,
      })
      const message1 = {
        '/ChargePercentageSelection': 100,
      }
      const message2 = {
        '/ChargeMinuteSelection': 'None',
      }

      wsClient.send(JSON.stringify(message1))
      wsClient.send(JSON.stringify(message2))
      handleParam('charge', 'pick')
      setAutoCharged(true)
    }

    // OPTIONAL: re-enable auto-charge once battery is back above 20:
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

  // For left column pick buttons (out1, out2, out3, park, charge)
  const handlePickButtonClick = (button) => {
    // If the Charge button is clicked, open the modal instead of sending the command immediately.
    if (button === 'charge') {
      setOpenChargeModal(true)
      return
    }
    // If battery is low (and the selection isn’t Park or Charge), force charge.
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
    // Update the pick state so that only the pressed button is true.
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
      toast.error('Battery level is too low, Robot is going to charging ...')
      // Force charge selection on the pick side.
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

  // For footer buttons: Park and Charge (treated as pick selections)
  const handlePickFooterButtonClick = (button) => {
    setPickPressed((prev) => ({
      ...prev,
      park: false,
      charge: false,
      [button]: true,
    }))
  }

  // Send the selection to the server.
  const handleParam = (button, group) => {
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      console.log('Sending message:', button)
      let message
      if (group === 'drop') {
        message = { '/drop_selection': button }
      } else if (group === 'pick') {
        message = { '/pick_selection': button }
      } else if (group === 'None') {
        const message1 = { '/pick_selection': button }
        const message2 = { '/drop_selection': button }
        const message3 = { '/navigation_cancel': 'stop' }
        wsClient.send(JSON.stringify(message1))
        wsClient.send(JSON.stringify(message2))
        wsClient.send(JSON.stringify(message3))
        setParam('None')
        return
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
      'pick - out1': 'Pick 1',
      'pick - out2': 'Pick 2',
      'pick - out3': 'Pick 3',
      'pick - park': 'Park',
      'pick - charge': 'Charge',
      'drop - out1': 'Drop 1',
      'drop - out2': 'Drop 2',
      'drop - out3': 'Drop 3',
    }
    return paramDescriptions[param] || param
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

  // Renders the extended arrow button only if the corresponding button is active.
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

  // Handle the submission of the charge modal
  const handleChargeSubmit = () => {
    if (!chargeValue) {
      toast.error('Please enter a valid value for charging.')
      return
    }
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      const message = {
        '/pick_selection': 'charge',
        // mode: chargeMode,
        // value: chargeValue,
      }
      if (chargeMode === 'percentage') {
        const message1 = {
          '/ChargePercentageSelection': chargeValue,
        }
        const message2 = {
          '/ChargeMinuteSelection': 'None',
        }

        wsClient.send(JSON.stringify(message1))
        wsClient.send(JSON.stringify(message2))
      } else if (chargeMode === 'time') {
        const message1 = {
          '/ChargeMinuteSelection': chargeValue,
        }
        const message2 = {
          '/ChargePercentageSelection': 'None',
        }
        wsClient.send(JSON.stringify(message1))
        wsClient.send(JSON.stringify(message2))
      }
      wsClient.send(JSON.stringify(message))
      setParam(`Charge (${chargeMode}: ${chargeValue})`)
      setPickPressed({
        out1: false,
        out2: false,
        out3: false,
        park: false,
        charge: true,
      })
      setOpenChargeModal(false)
      setChargeValue('')
    } else {
      toast.error('WebSocket not connected')
    }
  }

  const handleChargeCancel = () => {
    setOpenChargeModal(false)
    setChargeValue('')
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
          {param !== 'None' && handleCurrentParam(param)}
          <Button
            style={{ marginLeft: '10px', fontSize: '10px' }}
            variant='outlined'
            onClick={() => handleNone(param)}
          >
            {param === 'None' ? 'Durdur' : 'İptal Et'}
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
        {/* Main Buttons */}
        <div className={styles.mainButtons}>
          {/* Left Column: Pick Buttons */}
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
          {/* Right Column: Drop Buttons */}
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
      {/* Charge Modal */}
      <Modal
        open={openChargeModal}
        onClose={handleChargeCancel}
        aria-labelledby='charge-modal-title'
        aria-describedby='charge-modal-description'
      >
        <Box sx={modalStyle}>
          <h2 id='charge-modal-title'>Charge Settings</h2>
          <FormControl component='fieldset' fullWidth>
            <FormLabel component='legend'>Charge Mode</FormLabel>
            <RadioGroup
              row
              value={chargeMode}
              onChange={(e) => setChargeMode(e.target.value)}
            >
              <FormControlLabel
                value='percentage'
                control={<Radio />}
                label='Percentage'
              />
              <FormControlLabel value='time' control={<Radio />} label='Time' />
            </RadioGroup>
          </FormControl>
          <TextField
            label={
              chargeMode === 'percentage'
                ? 'Enter percentage'
                : 'Enter time (in minutes)'
            }
            type='number'
            value={chargeValue}
            onChange={(e) => setChargeValue(e.target.value)}
            fullWidth
            margin='normal'
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '10px',
            }}
          >
            <Button variant='outlined' onClick={handleChargeCancel}>
              Cancel
            </Button>
            <Button variant='contained' onClick={handleChargeSubmit}>
              Confirm
            </Button>
          </div>
        </Box>
      </Modal>
    </>
  )
}

export default Home
// ChargeMinuteSelection
// ChargePercentageSelection
