"use client";

import { useState } from "react";
import type { Slot } from "@/types";

interface SlotCardProps {
  slot: Slot;
  currentUserId: string;
  onReserve: (slotId: string, date: string, time: string) => Promise<{ error?: string }>;
  onCancel: (slotId: string, date: string, time: string) => Promise<{ error?: string }>;
}

export default function SlotCard({ slot, currentUserId, onReserve, onCancel }: SlotCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBooked = !!slot.player1_id;
  const isMine = slot.player1_id === currentUserId;

  async function handleReserve() {
    setError(null);
    setLoading(true);
    const result = await onReserve(slot.id, slot.date, slot.time);
    if (result.error) setError(result.error === "slot_full" ? "Bu slot dolu." : result.error);
    setLoading(false);
  }

  async function handleCancel() {
    setError(null);
    setLoading(true);
    await onCancel(slot.id, slot.date, slot.time);
    setLoading(false);
  }

  return (
    <div className={`bg-surface border rounded-2xl px-4 py-3 transition-all
      ${isMine ? "border-primary/50" : "border-border"}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-text-primary font-semibold text-base w-12">{slot.time}</span>
        </div>

        {isMine ? (
          <button
            onClick={handleCancel}
            disabled={loading}
            className="text-sm px-4 py-1.5 rounded-xl border border-border text-text-secondary transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "..." : "İptal"}
          </button>
        ) : isBooked ? (
          <span className="text-xs text-text-secondary px-3 py-1.5">Dolu</span>
        ) : (
          <button
            onClick={handleReserve}
            disabled={loading}
            className="text-sm px-4 py-1.5 rounded-xl bg-primary text-background font-semibold transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "..." : "Rezerve"}
          </button>
        )}
      </div>

      {error && <p className="text-red-400 text-xs mt-2 text-right">{error}</p>}
    </div>
  );
}
