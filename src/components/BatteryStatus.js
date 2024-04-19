import React from 'react'

const BatteryStatus = ({ level }) => {
  let batteryColor

  // Determine battery color based on level
  if (level >= 76) {
    batteryColor = 'green'
  } else if (level >= 51) {
    batteryColor = 'yellow'
  } else if (level >= 26) {
    batteryColor = 'orange'
  } else {
    batteryColor = 'red'
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '9999',
      }}
    >
      <div
        style={{
          width: '100px',
          height: '50px',
          border: '2px solid black',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: `${level}%`,
            height: '100%',
            backgroundColor: batteryColor,
          }}
        ></div>
      </div>
      <p>Battery: {level}%</p>
    </div>
  )
}

export default BatteryStatus
