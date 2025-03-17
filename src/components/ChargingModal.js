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

const ChargingModal = ({ open, onClose, wsClient, onSubmit }) => {
  const [chargeMode, setChargeMode] = useState('percentage')
  const [chargeValue, setChargeValue] = useState('')

  const handleChargeSubmit = () => {
    if (!chargeValue) {
      toast.error('Please enter a valid value for charging.')
      return
    }
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      if (chargeMode === 'percentage') {
        const message1 = { '/ChargePercentageSelection': chargeValue }
        const message2 = { '/ChargeMinuteSelection': 'None' }
        wsClient.send(JSON.stringify(message1))
        wsClient.send(JSON.stringify(message2))
      } else if (chargeMode === 'time') {
        const message1 = { '/ChargeMinuteSelection': chargeValue }
        const message2 = { '/ChargePercentageSelection': 'None' }
        wsClient.send(JSON.stringify(message1))
        wsClient.send(JSON.stringify(message2))
      }
      const message = { '/pick_selection': 'charge' }
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
          <Button variant='outlined' onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant='contained' onClick={handleChargeSubmit}>
            Confirm
          </Button>
        </div>
      </Box>
    </Modal>
  )
}

export default ChargingModal
