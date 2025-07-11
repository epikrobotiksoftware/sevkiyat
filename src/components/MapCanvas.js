import React, { useRef, useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import { HiRefresh } from 'react-icons/hi';
import styles from './home.module.css';

export default function MapCanvas({ src }) {
  const canvasRef = useRef();
  const containerRef = useRef();
  const imgRef    = useRef(new Image());
  const [scale,   setScale]   = useState(1);
  const [rot,     setRot]     = useState(0);      // degrees
  const [offset,  setOffset]  = useState({ x:0,y:0 });
  const [dragging,setDragging]= useState(false);
  const [startPos,setStartPos]= useState({ x:0,y:0 });

  // load image
  useEffect(() => {
    const img = imgRef.current;
    img.src = src;
    img.onload = () => draw();
  }, [src]);

  useEffect(() => {
    const container = containerRef.current;
    const handler = (e) => {
      e.preventDefault();      // stop the page from scrolling
      e.stopPropagation();     // don’t bubble to parent
      // now run your zoom logic:
      const delta = -e.deltaY * 0.001;
      setScale(s => Math.min(Math.max(0.1, s + delta), 10));
    };
    container.addEventListener('wheel', handler, { passive: false });
    return () => container.removeEventListener('wheel', handler);
  }, [setScale]);


  // redraw on any transform change
  useEffect(draw, [scale, rot, offset]);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current.complete) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    // clear
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    // translate to center + any pan
    ctx.translate(width/2 + offset.x, height/2 + offset.y);
    // rotate
    ctx.rotate((rot * Math.PI) / 180);
    // scale
    ctx.scale(scale, scale);
    // draw the image centered
    ctx.drawImage(
      imgRef.current,
      -imgRef.current.width/2,
      -imgRef.current.height/2
    );
    ctx.restore();
  }

  // wheel = zoom
  function onWheel(e) {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;  // tweak sensitivity
    setScale(s => Math.min(Math.max(0.1, s + delta), 10));
  }

  // pan start
  function onMouseDown(e) {
    setDragging(true);
    setStartPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  }
  // pan move
  function onMouseMove(e) {
    if (!dragging) return;
    setOffset({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y
    });
  }
  // pan end
  function endDrag() {
    setDragging(false);
  }

  // rotate 90°
  function rotate90() {
    setRot(r => (r + 90) % 360);
  }

  return (
    <div ref={containerRef} className={styles.mapContainer}>
      <Button
        className={styles.mapRotateBtn}
        variant="outlined"
        onClick={rotate90}
      >
        <HiRefresh />
      </Button>
      <canvas
        ref={canvasRef}
        className={styles.mapCanvas}
        width={800}
        height={600}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
      />
    </div>
  );
}
