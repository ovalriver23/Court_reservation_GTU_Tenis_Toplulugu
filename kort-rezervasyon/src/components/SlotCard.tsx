"use client";

import { useState } from "react";
import type { Slot } from "@/types";

function timeRange(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${time}-${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function isAdvanceLocked(slotDate: string, slotTime: string, minAdvanceHours: number): boolean {
  if (minAdvanceHours <= 0) return false;
  const now = new Date();
  const cutoff = new Date(now.getTime() + minAdvanceHours * 60 * 60 * 1000);
  const slotDateTime = new Date(`${slotDate}T${slotTime}:00`);
  return slotDateTime < cutoff;
}

interface SlotCardProps {
  slot: Slot;
  currentUserId: string;
  minAdvanceHours: number;
  onReserve: (slotId: string, date: string, time: string) => Promise<{ error?: string }>;
  onCancel: (slotId: string, date: string, time: string) => Promise<{ error?: string }>;
}

export default function SlotCard({ slot, currentUserId, minAdvanceHours, onReserve, onCancel }: SlotCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBooked = !!slot.player1_id;
  const isMine = slot.player1_id === currentUserId;
  const locked = !isBooked && !isMine && isAdvanceLocked(slot.date, slot.time, minAdvanceHours);

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
        <span className="text-text-primary font-semibold text-base">{timeRange(slot.time)}</span>

        {isMine ? (
          <button
            onClick={handleCancel}
            disabled={loading}
            className="text-sm px-4 py-1.5 rounded-xl border border-border text-text-secondary transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "..." : "İptal"}
          </button>
        ) : isBooked ? (
          <span className="text-xs text-text-secondary px-3 py-1.5 truncate max-w-[140px] text-right">
            {slot.player1_name ?? "Dolu"}
          </span>
        ) : locked ? (
          <button
            disabled
            className="text-sm px-4 py-1.5 rounded-xl border border-border text-text-secondary opacity-40 cursor-not-allowed"
          >
            Rezerve
          </button>
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

      {locked && (
        <p className="text-text-secondary text-xs mt-1.5 text-right">
          {minAdvanceHours} saat içindeki saatlere rezervasyon yapılamaz
        </p>
      )}
      {error && <p className="text-red-400 text-xs mt-2 text-right">{error}</p>}
    </div>
  );
}
