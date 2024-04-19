import { useState, useEffect } from 'react'
import * as ROSLIB from 'roslib'
function Home() {
  const [ros, setRos] = useState(new ROSLIB.Ros())
  const IP = '127.0.0.1'
  const PORT = '9090'

  useEffect(() => {
    connect()

    return () => {}
  }, [])

  function connect() {
    try {
      ros.connect('ws://' + IP + ':' + PORT + '')
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div>
      <h1>
        {ros.isConnected ? (
          'Connected'
        ) : (
          <button onClick={connect}>Connect</button>
        )}
      </h1>
      <button>pick 1</button>
      <button>pick 2</button>
      <button>pick 3</button>
      <button>Drop</button>
    </div>
  )
}
export default Home
