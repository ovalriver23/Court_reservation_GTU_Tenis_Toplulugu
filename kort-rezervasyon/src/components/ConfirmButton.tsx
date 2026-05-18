"use client";

import { useState } from "react";

interface ConfirmButtonProps {
  children: React.ReactNode;
  confirmText?: string;
  className?: string;
  onConfirm: () => void;
}

export default function ConfirmButton({ children, confirmText = "Emin misin?", className, onConfirm }: ConfirmButtonProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-text-secondary whitespace-nowrap">{confirmText}</span>
        <button
          type="button"
          onClick={() => { setConfirming(false); onConfirm(); }}
          className="px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-medium active:scale-95 transition-transform"
        >
          Evet
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="px-2.5 py-1 rounded-lg border border-border text-text-secondary text-xs active:scale-95 transition-transform"
        >
          Hayır
        </button>
      </div>
    );
  }

  return (
    <button type="button" onClick={() => setConfirming(true)} className={className}>
      {children}
    </button>
  );
}
