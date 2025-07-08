// Logo.js
import React from 'react'
import logoImage from '../Epik.jpeg'
// import logoImage from '../profSentetik.svg'

function Logo() {
  const url = 'https://profsentetik.com/app/Images/logodark_1679312205.svg'
  return (
    <div style={{ textAlign: 'center', margin: '20px 0' }}>
      <img
        src={logoImage || url }
        alt='Logo'
        style={{ maxWidth: '30%', height: '150px' }}
      />
    </div>
  )
}

export default Logo
