// Logo.js
import React from 'react'
import logoImage from '../Epik.jpeg' // Replace './logo.png' with the path to your logo image

function Logo() {
  return (
    <div style={{ textAlign: 'center', margin: '20px 0' }}>
      <img
        src={logoImage}
        alt='Logo'
        style={{ maxWidth: '30%', height: 'auto' }}
      />
    </div>
  )
}

export default Logo
