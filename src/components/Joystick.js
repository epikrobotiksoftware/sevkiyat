import React, { useState, useRef, useEffect } from 'react'

const Joystick = ({ wsClient }) => {
  // State to track the joystick handle position relative to its center.
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const joystickRef = useRef(null)
  // State for continuous command transmission.
  const [isDragging, setIsDragging] = useState(false)

  // Container dragging states for moving the whole joystick.
  const [containerPos, setContainerPos] = useState({ x: 100, y: 100 })
  const containerDragging = useRef(false)
  const dragStartPos = useRef({ x: 0, y: 0 })
  const containerStartPos = useRef({ x: 0, y: 0 })

  // Maximum distance the joystick handle can move (in pixels).
  const maxDistance = 50

  // Function to send control commands to the WebSocket server.
  const sendCommand = (linear, angular) => {
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      const message = { type: 'joystick', linear, angular }
      wsClient.send(JSON.stringify(message))
    }
  }

  // Compute new joystick position and send corresponding command.
  const updatePosition = (clientX, clientY) => {
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
    // Immediately send the command on update.
    const linear = -offsetY / maxDistance
    const angular = offsetX / maxDistance
    sendCommand(linear, angular)
  }

  // Joystick handle mouse events.
  const handleMouseDown = (e) => {
    e.stopPropagation() // Prevent container drag triggering.
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

  // Joystick handle touch events.
  const handleTouchStart = (e) => {
    e.stopPropagation()
    setIsDragging(true)
    const touch = e.touches[0]
    updatePosition(touch.clientX, touch.clientY)
  }

  const handleTouchMove = (e) => {
    e.preventDefault() // Prevent scrolling.
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

  // Continuously send joystick command while dragging.
  useEffect(() => {
    let intervalId
    if (isDragging) {
      intervalId = setInterval(() => {
        const linear = -position.y / maxDistance
        const angular = position.x / maxDistance
        sendCommand(linear, angular)
      }, 100) // Send command every 100ms.
    }
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isDragging, position, wsClient])

  // Global event listeners for mouse events.
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, wsClient])

  // Container drag event handlers for mouse.
  const handleContainerMouseDown = (e) => {
    containerDragging.current = true
    dragStartPos.current = { x: e.clientX, y: e.clientY }
    containerStartPos.current = { ...containerPos }
  }

  const handleContainerMouseMove = (e) => {
    if (!containerDragging.current) return
    const dx = e.clientX - dragStartPos.current.x
    const dy = e.clientY - dragStartPos.current.y
    setContainerPos({
      x: containerStartPos.current.x + dx,
      y: containerStartPos.current.y + dy,
    })
  }

  const handleContainerMouseUp = () => {
    containerDragging.current = false
  }

  // Container drag event handlers for touch.
  const handleContainerTouchStart = (e) => {
    containerDragging.current = true
    const touch = e.touches[0]
    dragStartPos.current = { x: touch.clientX, y: touch.clientY }
    containerStartPos.current = { ...containerPos }
  }

  const handleContainerTouchMove = (e) => {
    if (!containerDragging.current) return
    const touch = e.touches[0]
    const dx = touch.clientX - dragStartPos.current.x
    const dy = touch.clientY - dragStartPos.current.y
    setContainerPos({
      x: containerStartPos.current.x + dx,
      y: containerStartPos.current.y + dy,
    })
  }

  const handleContainerTouchEnd = () => {
    containerDragging.current = false
  }

  // Global listeners for container drag (mouse).
  useEffect(() => {
    window.addEventListener('mousemove', handleContainerMouseMove)
    window.addEventListener('mouseup', handleContainerMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleContainerMouseMove)
      window.removeEventListener('mouseup', handleContainerMouseUp)
    }
  }, [containerPos])

  // Global listeners for container drag (touch).
  useEffect(() => {
    window.addEventListener('touchmove', handleContainerTouchMove)
    window.addEventListener('touchend', handleContainerTouchEnd)
    return () => {
      window.removeEventListener('touchmove', handleContainerTouchMove)
      window.removeEventListener('touchend', handleContainerTouchEnd)
    }
  }, [containerPos])

  return (
    <div
      style={{
        position: 'fixed',
        left: containerPos.x,
        top: containerPos.y,
        zIndex: 1000,
      }}
    >
      {/* Drag handle for the entire joystick */}
      <div
        onMouseDown={handleContainerMouseDown}
        onTouchStart={handleContainerTouchStart}
        style={{
          background: '#aaa',
          padding: '5px',
          cursor: 'move',
          textAlign: 'center',
          userSelect: 'none',
        }}
      >
        Drag Joystick
      </div>
      <div
        ref={joystickRef}
        style={{
          width: 120,
          height: 120,
          background: '#ccc',
          borderRadius: '50%',
          position: 'relative',
          touchAction: 'none',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            width: 50,
            height: 50,
            background: '#888',
            borderRadius: '50%',
            position: 'absolute',
            top: `calc(50% - 25px + ${position.y}px)`,
            left: `calc(50% - 25px + ${position.x}px)`,
            transition: isDragging ? 'none' : 'top 0.1s, left 0.1s',
          }}
        />
      </div>
    </div>
  )
}

export default Joystick
