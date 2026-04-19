"use client";

import { useState } from "react";
import type { Slot } from "@/types";

interface SlotCardProps {
  slot: Slot;
  currentUserId: string;
  onReserve: (slotId: string, date: string, time: string, partnerName?: string) => Promise<{ error?: string }>;
  onCancel: (slotId: string, date: string, time: string) => Promise<{ error?: string }>;
}

function getSlotStatus(slot: Slot, userId: string) {
  const p1 = slot.player1_id;
  const p2 = slot.player2_id;
  const isMine = p1 === userId || p2 === userId;
  const isFull = !!p1 && !!p2;
  const count = (p1 ? 1 : 0) + (p2 ? 1 : 0);
  return { isMine, isFull, count };
}

const ERROR_MESSAGES: Record<string, string> = {
  weekly_limit: "Bu hafta 3 rezervasyon hakkınızı kullandınız.",
  daily_limit: "Bu güne zaten bir rezervasyon yaptınız.",
  slot_full: "Bu slot doldu.",
};

export default function SlotCard({ slot, currentUserId, onReserve, onCancel }: SlotCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPartner, setShowPartner] = useState(false);
  const [partnerName, setPartnerName] = useState("");
  const { isMine, isFull, count } = getSlotStatus(slot, currentUserId);

  async function handleReserve() {
    setError(null);
    setLoading(true);
    const result = await onReserve(slot.id, slot.date, slot.time, partnerName.trim() || undefined);
    if (result.error) setError(ERROR_MESSAGES[result.error] ?? result.error);
    else { setShowPartner(false); setPartnerName(""); }
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
        {/* Sol: Saat + doluluk */}
        <div className="flex items-center gap-3">
          <span className="text-text-primary font-semibold text-base w-12">{slot.time}</span>
          <div className="flex gap-1">
            {[0, 1].map((i) => {
              const filled = i < count;
              const mine = (i === 0 && slot.player1_id === currentUserId) ||
                           (i === 1 && slot.player2_id === currentUserId);
              return (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full
                    ${mine ? "bg-primary" : filled ? "bg-text-secondary" : "bg-border"}`}
                />
              );
            })}
          </div>
          {count > 0 && (
            <span className="text-text-secondary text-xs">{count}/2</span>
          )}
        </div>

        {/* Sağ: Buton */}
        <div className="flex flex-col items-end gap-1">
          {isMine ? (
            <button
              onClick={handleCancel}
              disabled={loading}
              className="text-sm px-4 py-1.5 rounded-xl border border-border text-text-secondary transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? "..." : "İptal"}
            </button>
          ) : isFull ? (
            <span className="text-xs text-text-secondary px-3 py-1.5">Dolu</span>
          ) : (
            <button
              onClick={() => setShowPartner(!showPartner)}
              disabled={loading}
              className="text-sm px-4 py-1.5 rounded-xl bg-primary text-background font-semibold transition-all active:scale-95 disabled:opacity-50"
            >
              Rezerve
            </button>
          )}
        </div>
      </div>

      {/* Arkadaş + Onay alanı */}
      {showPartner && !isMine && !isFull && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-text-secondary text-xs mb-2">Arkadaşınla mı geliyorsun? (opsiyonel)</p>
          <input
            type="text"
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
            placeholder="Arkadaşının adı"
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-text-primary text-sm placeholder-text-secondary focus:outline-none focus:border-primary transition-colors mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={handleReserve}
              disabled={loading}
              className="flex-1 bg-primary text-background text-sm font-semibold py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? "..." : "Onayla"}
            </button>
            <button
              onClick={() => { setShowPartner(false); setPartnerName(""); }}
              className="px-4 text-text-secondary text-sm border border-border rounded-xl transition-all active:scale-95"
            >
              Vazgeç
            </button>
          </div>
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </div>
      )}

      {/* Hata (normal rezerve için) */}
      {!showPartner && error && (
        <p className="text-red-400 text-xs mt-2 text-right">{error}</p>
      )}
    </div>
  );
}
