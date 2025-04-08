import React, { useState, useRef, useEffect } from 'react'
import { RiCloseLine } from 'react-icons/ri'

const MobileJoystick = ({ wsClient, onExit }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const joystickRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const maxDistance = 60

  // Function to send joystick commands.
  const sendCommand = (linear, angular) => {
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      const message = { type: 'joystick', linear, angular }
      wsClient.send(JSON.stringify(message))
    }
  }

  // Update the joystick handle position and calculate command values.
  const updatePosition = (clientX, clientY) => {
    if (!joystickRef.current) return
    const rect = joystickRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    let offsetX = clientX - centerX
    let offsetY = clientY - centerY
    const distance = Math.sqrt(offsetX ** 2 + offsetY ** 2)
    if (distance > maxDistance) {
      const angle = Math.atan2(offsetY, offsetX)
      offsetX = maxDistance * Math.cos(angle)
      offsetY = maxDistance * Math.sin(angle)
    }
    setPosition({ x: offsetX, y: offsetY })
    const linear = -offsetY / maxDistance
    const angular = offsetX / maxDistance
    sendCommand(linear, angular)
  }

  // Touch event handlers.
  const handleTouchStart = (e) => {
    e.preventDefault()
    setIsDragging(true)
    const touch = e.touches[0]
    updatePosition(touch.clientX, touch.clientY)
  }

  const handleTouchMove = (e) => {
    e.preventDefault() // Prevents scrolling.
    if (isDragging) {
      const touch = e.touches[0]
      updatePosition(touch.clientX, touch.clientY)
    }
  }

  const handleTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false)
      setPosition({ x: 0, y: 0 })
      sendCommand(0, 0)
    }
  }

  // Mouse event handlers (optional for hybrid devices).
  const handleMouseDown = (e) => {
    e.preventDefault()
    setIsDragging(true)
    updatePosition(e.clientX, e.clientY)
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      updatePosition(e.clientX, e.clientY)
    }
  }

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false)
      setPosition({ x: 0, y: 0 })
      sendCommand(0, 0)
    }
  }

  // Continuously send commands while dragging.
  useEffect(() => {
    let intervalId
    if (isDragging) {
      intervalId = setInterval(() => {
        const linear = -position.y / maxDistance
        const angular = position.x / maxDistance
        sendCommand(linear, angular)
      }, 100)
    }
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isDragging, position, wsClient])

  // Global mouse event listeners.
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, wsClient])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.3)', // Semi-transparent overlay
        backdropFilter: 'blur(8px)', // Blurring the background
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Exit Button */}
      <button
        onClick={onExit}
        style={{
          position: 'absolute',
          top: 10,
          left: '50%', // Position at the center horizontally
          transform: 'translateX(-50%)', // Center alignment adjustment
          zIndex: 10000, // Ensure it's above BatteryStatus
          background: 'rgba(0,0,0,0.5)',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: '16px',
          cursor: 'pointer',
        }}
      >
        <RiCloseLine size={24} />
      </button>

      {/* Joystick Container centered by Flexbox */}
      <div
        ref={joystickRef}
        style={{
          width: 200,
          height: 200,
          background: '#ccc',
          borderRadius: '50%',
          touchAction: 'none',
          userSelect: 'none',
          position: 'relative',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            width: 80,
            height: 80,
            background: '#888',
            borderRadius: '50%',
            position: 'absolute',
            top: `calc(50% - 40px + ${position.y}px)`,
            left: `calc(50% - 40px + ${position.x}px)`,
            transition: isDragging ? 'none' : 'top 0.1s, left 0.1s',
          }}
        />
      </div>
    </div>
  )
}

export default MobileJoystick
