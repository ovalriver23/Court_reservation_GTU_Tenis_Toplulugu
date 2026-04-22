"use client";

import { useState } from "react";

export default function AnimatedBall() {
  const [animating, setAnimating] = useState(false);

  function handleClick() {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => setAnimating(false), 1600);
  }

  return (
    <>
      <style>{`
        @keyframes ballBounce {
          /* Zemine bask — fırlatmadan önce squash */
          0%   { transform: translateY(0px)   scaleX(1.12) scaleY(0.88); }
          /* 1. zirve — 5 birim */
          9%   { transform: translateY(-30px) scaleX(0.90) scaleY(1.10); }
          /* 1. iniş — squash */
          20%  { transform: translateY(0px)   scaleX(1.10) scaleY(0.90); }
          /* 2. zirve — 3 birim */
          30%  { transform: translateY(-18px) scaleX(0.94) scaleY(1.06); }
          /* 2. iniş — squash */
          40%  { transform: translateY(0px)   scaleX(1.06) scaleY(0.94); }
          /* 3. zirve — 1 birim */
          49%  { transform: translateY(-6px)  scaleX(0.98) scaleY(1.02); }
          /* 3. iniş — hafif squash */
          57%  { transform: translateY(0px)   scaleX(1.03) scaleY(0.97); }
          /* Yerleşme */
          70%  { transform: translateY(0px)   scaleX(1.00) scaleY(1.00); }
          100% { transform: translateY(0px)   scaleX(1.00) scaleY(1.00); }
        }
      `}</style>

      <div
        onClick={handleClick}
        style={{
          width: 52,
          height: 52,
          margin: "0 auto 16px",
          cursor: "pointer",
          userSelect: "none",
          filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))",
          animation: animating
            ? "ballBounce 1.5s cubic-bezier(0.33, 0, 0.66, 1) forwards"
            : "none",
          transformOrigin: "center bottom",
        }}
      >
        <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"
          style={{ width: 52, height: 52, display: "block" }}>
          <circle cx="30" cy="30" r="29" fill="#D0FF00" />
          <circle cx="30" cy="30" r="29" fill="none" stroke="#AACC00" strokeWidth="1" />
          <path d="M 8 13 C 20 22, 20 38, 8 47"  stroke="#1a1a1a" strokeWidth="3.5"
            fill="none" strokeLinecap="round" />
          <path d="M 52 13 C 40 22, 40 38, 52 47" stroke="#1a1a1a" strokeWidth="3.5"
            fill="none" strokeLinecap="round" />
          <ellipse cx="20" cy="16" rx="8" ry="5" fill="white" opacity="0.2"
            transform="rotate(-40 20 16)" />
        </svg>
      </div>
    </>
  );
}
