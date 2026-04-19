"use client";

import { useEffect, useRef, useState } from "react";

const LOGO           = 52;
const BALL           = 62;
const SPEED          = 6;    // px/frame — sabit hız (bilardo gibi)
const BOUNCE_MS      = 3000; // ms serbest zıplama süresi
const STEER_STRENGTH = 0.07; // dönüş kuvveti (0=hiç yönelmez, 1=anında döner)

// 5 farklı başlangıç yönü (round-robin)
const DIRS = [
  { vx:  SPEED,       vy: -SPEED * 0.7 },
  { vx: -SPEED,       vy: -SPEED * 0.5 },
  { vx:  SPEED * 0.8, vy:  SPEED       },
  { vx: -SPEED * 0.6, vy: -SPEED       },
  { vx:  SPEED,       vy: -SPEED * 1.2 },
];

function BallSVG({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"
      style={{ width: size, height: size, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" }}
    >
      <circle cx="30" cy="30" r="29" fill="#D0FF00" />
      <circle cx="30" cy="30" r="29" fill="none" stroke="#AACC00" strokeWidth="1" />
      <path d="M 8 13 C 20 22, 20 38, 8 47"  stroke="#1a1a1a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M 52 13 C 40 22, 40 38, 52 47" stroke="#1a1a1a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <ellipse cx="20" cy="16" rx="8" ry="5" fill="white" opacity="0.2" transform="rotate(-40 20 16)" />
    </svg>
  );
}

export default function TennisBallLogo() {
  const logoRef   = useRef<HTMLButtonElement>(null);
  const dirIndex  = useRef(0);

  const s = useRef({
    x: 0, y: 0, vx: 0, vy: 0, angle: 0,
    logoX: 0, logoY: 0,
    bounceStart: 0,
    returning: false,
    running: false,
    raf: 0,
  });

  const [flying, setFlying] = useState(false);
  const [pos,    setPos]    = useState({ x: -999, y: -999, angle: 0 });

  useEffect(() => () => cancelAnimationFrame(s.current.raf), []);

  // Scrollbar olmadan gerçek görünür alan
  function bounds() {
    return {
      maxX: document.documentElement.clientWidth  - BALL,
      maxY: document.documentElement.clientHeight - BALL,
    };
  }

  function handleLogoClick() {
    if (flying || !logoRef.current) return;

    const rect  = logoRef.current.getBoundingClientRect();
    const logoX = rect.left + rect.width  / 2 - BALL / 2;
    const logoY = rect.top  + rect.height / 2 - BALL / 2;

    const idx      = dirIndex.current;
    dirIndex.current = (idx + 1) % DIRS.length;

    const c        = s.current;
    c.x            = logoX;
    c.y            = logoY;
    c.logoX        = logoX;
    c.logoY        = logoY;
    c.vx           = DIRS[idx].vx;
    c.vy           = DIRS[idx].vy;
    c.angle        = 0;
    c.returning    = false;
    c.running      = true;
    c.bounceStart  = performance.now();

    setPos({ x: logoX, y: logoY, angle: 0 });
    setFlying(true);
    cancelAnimationFrame(c.raf);

    function loop(now: DOMHighResTimeStamp) {
      const c = s.current;
      if (!c.running) return;

      const { maxX, maxY } = bounds();
      const elapsed = now - c.bounceStart;

      // Dönüş fazına geç
      if (!c.returning && elapsed >= BOUNCE_MS) {
        c.returning = true;
      }

      // Dönüş fazında: hızı logo yönüne doğru yavaşça döndür
      if (c.returning) {
        const dx   = c.logoX - c.x;
        const dy   = c.logoY - c.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Logo'ya yeterince yaklaştıysa bitir
        if (dist < SPEED * 1.5) {
          c.running = false;
          setPos({ x: c.logoX, y: c.logoY, angle: c.angle });
          setTimeout(() => setFlying(false), 80);
          return;
        }

        // Mevcut açıdan hedef açıya STEER_STRENGTH kadar döndür
        const targetAngle  = Math.atan2(dy, dx);
        let   currentAngle = Math.atan2(c.vy, c.vx);
        let   diff         = targetAngle - currentAngle;

        // Açıyı [-π, π] aralığına normalize et
        if (diff >  Math.PI) diff -= 2 * Math.PI;
        if (diff < -Math.PI) diff += 2 * Math.PI;

        const newAngle = currentAngle + diff * STEER_STRENGTH;
        c.vx = Math.cos(newAngle) * SPEED;
        c.vy = Math.sin(newAngle) * SPEED;
      }

      // Hareket
      c.x += c.vx;
      c.y += c.vy;

      // Duvar yansımaları — her zaman aktif (dönüş sırasında da)
      if (c.x <= 0)    { c.x = 0;    c.vx =  Math.abs(c.vx); }
      if (c.x >= maxX) { c.x = maxX; c.vx = -Math.abs(c.vx); }
      if (c.y <= 0)    { c.y = 0;    c.vy =  Math.abs(c.vy); }
      if (c.y >= maxY) { c.y = maxY; c.vy = -Math.abs(c.vy); }

      // Spin: yatay harekete göre döner
      c.angle += c.vx * 0.5;

      setPos({ x: c.x, y: c.y, angle: c.angle });
      c.raf = requestAnimationFrame(loop);
    }

    c.raf = requestAnimationFrame(loop);
  }

  return (
    <>
      <button
        ref={logoRef}
        onClick={handleLogoClick}
        className="mb-4 rounded-full outline-none bg-transparent border-0 p-0 transition-opacity duration-200"
        style={{
          width:         LOGO,
          height:        LOGO,
          opacity:       flying ? 0 : 1,
          pointerEvents: flying ? "none" : "auto",
          cursor:        "pointer",
        }}
        title="Oyna!"
      >
        <BallSVG size={LOGO} />
      </button>

      {flying && (
        <div
          className="fixed z-50 select-none touch-none pointer-events-none"
          style={{
            left:       pos.x,
            top:        pos.y,
            width:      BALL,
            height:     BALL,
            transform:  `rotate(${pos.angle}deg)`,
            willChange: "transform",
          }}
        >
          <BallSVG size={BALL} />
        </div>
      )}
    </>
  );
}
