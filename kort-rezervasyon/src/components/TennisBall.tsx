"use client";

import { useEffect, useRef, useState } from "react";

const SIZE = 60;
const GRAVITY = 0.5;
const BOUNCE = 0.68;

export default function TennisBall() {
  const [tf, setTf] = useState({ x: 0, y: 0, angle: 0 });
  const [ready, setReady] = useState(false);

  const c = useRef({
    x: 0, y: 0, vx: 0, vy: 0, angle: 0,
    running: false, raf: 0,
    dragging: false,
    startX: 0, startY: 0,
    lastX: 0, lastY: 0,
    dragVx: 0, dragVy: 0,
    lastT: 0,
  });

  useEffect(() => {
    c.current.x = window.innerWidth / 2 - SIZE / 2;
    c.current.y = 120;
    setTf({ x: c.current.x, y: c.current.y, angle: 0 });
    setReady(true);
    return () => cancelAnimationFrame(c.current.raf);
  }, []);

  function runLoop() {
    function loop() {
      const s = c.current;
      if (!s.running || s.dragging) return;

      s.vy += GRAVITY;
      s.x  += s.vx;
      s.y  += s.vy;

      const maxX = window.innerWidth  - SIZE;
      const maxY = window.innerHeight - SIZE;

      if (s.x <= 0)    { s.x = 0;    s.vx =  Math.abs(s.vx) * BOUNCE; }
      if (s.x >= maxX) { s.x = maxX; s.vx = -Math.abs(s.vx) * BOUNCE; }
      if (s.y <= 0)    { s.y = 0;    s.vy =  Math.abs(s.vy) * BOUNCE; }
      if (s.y >= maxY) {
        s.y = maxY;
        s.vy = Math.abs(s.vy) < 2 ? 0 : -s.vy * BOUNCE;
        s.vx *= 0.9;
      }

      s.angle += s.vx * 3;
      setTf({ x: s.x, y: s.y, angle: s.angle });
      s.raf = requestAnimationFrame(loop);
    }
    loop();
  }

  function onPointerDown(e: React.PointerEvent) {
    const s = c.current;
    s.dragging = true;
    s.startX = s.lastX = e.clientX;
    s.startY = s.lastY = e.clientY;
    s.dragVx = s.dragVy = 0;
    s.lastT = Date.now();
    s.running = false;
    cancelAnimationFrame(s.raf);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    const s = c.current;
    if (!s.dragging) return;
    const now = Date.now();
    const dt  = Math.max(now - s.lastT, 1);
    s.dragVx  = ((e.clientX - s.lastX) / dt) * 16;
    s.dragVy  = ((e.clientY - s.lastY) / dt) * 16;
    s.lastX   = e.clientX;
    s.lastY   = e.clientY;
    s.lastT   = now;
    s.x = e.clientX - SIZE / 2;
    s.y = e.clientY - SIZE / 2;
    s.angle  += s.dragVx * 2;
    setTf({ x: s.x, y: s.y, angle: s.angle });
  }

  function onPointerUp(e: React.PointerEvent) {
    const s = c.current;
    if (!s.dragging) return;
    s.dragging = false;

    const dx   = e.clientX - s.startX;
    const dy   = e.clientY - s.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 8) {
      // tap → launch upward
      s.vx = (Math.random() - 0.5) * 14;
      s.vy = -(Math.random() * 8 + 10);
    } else {
      // throw → use drag velocity
      s.vx = s.dragVx;
      s.vy = s.dragVy;
    }
    s.running = true;
    runLoop();
  }

  if (!ready) return null;

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="fixed z-50 select-none touch-none"
      style={{
        left: tf.x,
        top:  tf.y,
        width:  SIZE,
        height: SIZE,
        transform: `rotate(${tf.angle}deg)`,
        cursor: "grab",
        willChange: "transform",
      }}
      title="Tıkla veya sürükle!"
    >
      <svg
        viewBox="0 0 60 60"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.45))" }}
      >
        {/* Ball body */}
        <circle cx="30" cy="30" r="29" fill="#D0FF00" />
        <circle cx="30" cy="30" r="29" fill="none" stroke="#AACC00" strokeWidth="1" />
        {/* Left seam */}
        <path
          d="M 8 13 C 20 22, 20 38, 8 47"
          stroke="#1a1a1a" strokeWidth="3.5" fill="none" strokeLinecap="round"
        />
        {/* Right seam */}
        <path
          d="M 52 13 C 40 22, 40 38, 52 47"
          stroke="#1a1a1a" strokeWidth="3.5" fill="none" strokeLinecap="round"
        />
        {/* Gloss */}
        <ellipse cx="20" cy="16" rx="8" ry="5" fill="white" opacity="0.2" transform="rotate(-40 20 16)" />
      </svg>
    </div>
  );
}
