import React from 'react';

const BatteryStatus = ({ level, chargingStatus }) => {
  let batteryColor;

  // Determine battery color based on level
  if (level >= 76) {
    batteryColor = 'green';
  } else if (level >= 51) {
    batteryColor = 'yellow';
  } else if (level >= 26) {
    batteryColor = 'orange';
  } else {
    batteryColor = 'red';
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: '9999',
        // pointerEvents: joystickEnabled ? 'none' : 'auto', // conditionally disable events
      }}
    >
      <div
        style={{
          width: '100px',
          height: '50px',
          border: '2px solid black',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '16px',
          color: level < 30 ? 'red' : 'black',
        }}
      >
        <div
          style={{
            width: `${level}%`,
            height: '100%',
            backgroundColor: batteryColor,
            position: 'absolute',
            left: 0,
            top: 0,
            zIndex: 1,
          }}
        ></div>
        <span style={{ position: 'relative', zIndex: 2 }}>
          {level}% {chargingStatus === 1 && '  ⚡︎'}
        </span>
      </div>
    </div>
  )
};

export default BatteryStatus;
