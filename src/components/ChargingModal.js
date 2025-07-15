import React, { useState } from 'react'
import {
  Modal,
  Box,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material'
import { toast } from 'react-toastify'

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

const ChargingModal = ({ open, onClose, wsClient, onSubmit, robotName }) => {
  const [chargeMode, setChargeMode] = useState('percentage')
  const [chargeValue, setChargeValue] = useState('')

  const handleChargeSubmit = () => {
    if (!chargeValue) {
      toast.error('Please enter a valid value for charging.')
      return
    }
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      if (chargeMode === 'percentage') {
        const message1 = { type: 'param', '/ChargePercentageSelection': chargeValue, robotName }
        const message2 = { type: 'param', '/ChargeMinuteSelection': 'None', robotName }
        wsClient.send(JSON.stringify(message1))
        wsClient.send(JSON.stringify(message2))
      } else if (chargeMode === 'time') {
        const message1 = { type: 'param', '/ChargeMinuteSelection': chargeValue, robotName }
        const message2 = { type: 'param', '/ChargePercentageSelection': 'None', robotName }
        wsClient.send(JSON.stringify(message1))
        wsClient.send(JSON.stringify(message2))
      }
      const message = { type: 'param', '/pick_selection': 'charge', robotName }
      wsClient.send(JSON.stringify(message))
      if (onSubmit) {
        onSubmit(`Charge (${chargeMode}: ${chargeValue})`)
      }
      setChargeValue('')
      onClose()
    } else {
      toast.error('WebSocket not connected')
    }
  }

  const handleCancel = () => {
    setChargeValue('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      aria-labelledby='charge-modal-title'
      aria-describedby='charge-modal-description'
    >
      <Box sx={modalStyle}>
        <h2 id='charge-modal-title'>Şarj Ayarları</h2>
        <FormControl component='fieldset' fullWidth>
          <FormLabel component='legend'>Mod</FormLabel>
          <RadioGroup
            row
            value={chargeMode}
            onChange={(e) => setChargeMode(e.target.value)}
          >
            <FormControlLabel
              value='percentage'
              control={<Radio />}
              label='Yüzdelik Oran'
            />
            <FormControlLabel
              value='time'
              control={<Radio />}
              label='Zamansal(Dakika)'
            />
          </RadioGroup>
        </FormControl>
        <TextField
          label={
            chargeMode === 'percentage'
              ? ' Yüzdelik Oran Giriniz'
              : ' Zaman Giriniz (Dakika)'
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
          <Button variant='outlined' onClick={handleCancel}>
            İptal
          </Button>
          <Button variant='contained' onClick={handleChargeSubmit}>
            Gönder
          </Button>
        </div>
      </Box>
    </Modal>
  )
}

export default ChargingModal
