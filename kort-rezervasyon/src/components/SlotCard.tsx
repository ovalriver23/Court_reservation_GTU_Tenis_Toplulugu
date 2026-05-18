"use client";

import { useState, useEffect, useRef } from "react";
import { searchUsers } from "@/lib/actions/users";
import type { Slot } from "@/types";

function timeRange(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${h}.${String(m).padStart(2, "0")} - ${h + 1}.${String(m).padStart(2, "0")}`;
}

interface SlotCardProps {
  slot: Slot;
  currentUserId: string;
  isPastDate: boolean;
  primeTimeStart?: string;
  primeTimeEnd?: string;
  minCancelHours?: number;
  onReserve: (slotId: string, date: string, time: string, player2Id?: string | null) => Promise<{ error?: string }>;
  onCancel: (slotId: string, date: string, time: string) => Promise<{ error?: string }>;
}

export default function SlotCard({ slot, currentUserId, isPastDate, primeTimeStart = "16:00", primeTimeEnd = "20:00", minCancelHours = 0, onReserve, onCancel }: SlotCardProps) {
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [picking, setPicking]     = useState(false);
  const [expanded, setExpanded]   = useState(false);
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState<{ id: string; name: string }[]>([]);
  const [partner, setPartner]     = useState<{ id: string; name: string } | null>(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isBooked = !!slot.player1_id;
  const isMine   = slot.player1_id === currentUserId || slot.player2_id === currentUserId;
  const hasNames = !!(slot.player1_name || slot.player2_name);
  const isPrimeTime = slot.time >= primeTimeStart && slot.time < primeTimeEnd;

  const cancelLocked = minCancelHours > 0 &&
    (new Date(`${slot.date}T${slot.time}:00`).getTime() - Date.now()) / 3600000 < minCancelHours;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const res = await searchUsers(query);
      setResults(res);
      setSearching(false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  async function handleReserve() {
    setError(null);
    setLoading(true);
    const result = await onReserve(slot.id, slot.date, slot.time, partner?.id ?? null);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setPicking(false);
      setPartner(null);
      setQuery("");
    }
    setLoading(false);
  }

  async function handleCancel() {
    setError(null);
    setLoading(true);
    await onCancel(slot.id, slot.date, slot.time);
    setLoading(false);
  }

  function handlePickPartner(u: { id: string; name: string }) {
    setPartner(u);
    setQuery("");
    setResults([]);
  }

  const displayNames = [slot.player1_name, slot.player2_name].filter(Boolean).join(" & ");

  if (isPastDate) {
    return (
      <div className="bg-surface border border-border rounded-2xl px-4 py-3 opacity-35">
        <div className="flex items-center justify-between gap-3">
          <span className="text-text-primary font-semibold text-base">{timeRange(slot.time)}</span>
          <div className="flex items-center gap-2 min-w-0">
            {isBooked && (
              <span className="text-xs text-text-secondary truncate max-w-[140px] text-right">
                {displayNames || "Dolu"}
              </span>
            )}
            <span className="text-xs text-text-secondary shrink-0">Geçmiş</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-surface border rounded-2xl px-4 py-3 transition-all ${isMine ? "border-primary/50" : "border-border"}`}>
      <div
        className="flex items-center justify-between gap-3"
        onClick={() => { if (isBooked && hasNames && !picking) setExpanded(e => !e); }}
        style={{ cursor: isBooked && hasNames && !picking ? "pointer" : "default" }}
      >
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-text-primary font-semibold text-base">{timeRange(slot.time)}</span>
          {isPrimeTime && !isBooked && (
            <span className="text-[10px] font-semibold text-primary/80 bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
              Prime
            </span>
          )}
        </div>

        {isMine ? (
          <div className="flex items-center gap-2 min-w-0">
            {!expanded && <span className="text-xs text-text-secondary truncate">{displayNames}</span>}
            <button
              onClick={e => { e.stopPropagation(); if (!cancelLocked) handleCancel(); }}
              disabled={loading || cancelLocked}
              title={cancelLocked ? `Randevuya ${minCancelHours} saatten az kaldığı için iptal edilemiyor` : undefined}
              className="text-sm px-4 py-1.5 rounded-xl border border-border text-text-secondary transition-all active:scale-95 disabled:opacity-50 shrink-0"
            >
              {loading ? "..." : cancelLocked ? "Kilitli" : "İptal"}
            </button>
          </div>
        ) : isBooked ? (
          <div className="flex items-center gap-1.5 min-w-0">
            {!expanded && (
              <span className="text-xs text-text-secondary truncate max-w-[140px] text-right">
                {displayNames || "Dolu"}
              </span>
            )}
            {hasNames && (
              <svg className={`shrink-0 w-3.5 h-3.5 text-text-secondary transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        ) : picking ? (
          <button
            onClick={() => { setPicking(false); setPartner(null); setQuery(""); setError(null); }}
            className="text-xs text-text-secondary underline underline-offset-2 shrink-0"
          >
            Vazgeç
          </button>
        ) : (
          <button
            onClick={() => setPicking(true)}
            disabled={loading}
            className="text-sm px-4 py-1.5 rounded-xl bg-primary text-background font-semibold transition-all active:scale-95 disabled:opacity-50 shrink-0"
          >
            Rezerve
          </button>
        )}
      </div>

      {expanded && hasNames && (
        <div className="mt-3 rounded-xl px-3 py-2.5 space-y-1.5" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {slot.player1_name && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/30 uppercase tracking-wider shrink-0 whitespace-nowrap">Oyuncu 1</span>
              <span className="text-white/90 text-sm font-medium">{slot.player1_name}</span>
            </div>
          )}
          {slot.player2_name && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/30 uppercase tracking-wider shrink-0 whitespace-nowrap">Oyuncu 2</span>
              <span className="text-white/90 text-sm font-medium">{slot.player2_name}</span>
            </div>
          )}
        </div>
      )}

      {picking && (
        <div className="mt-3 space-y-2">
          {partner ? (
            <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-xl px-3 py-2">
              <span className="text-sm text-primary font-medium">{partner.name}</span>
              <button onClick={() => setPartner(null)} className="text-text-secondary text-xs underline underline-offset-2">
                Kaldır
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Arkadaş ara..."
                className="w-full rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
              />
              {searching && (
                <div className="absolute right-3 top-2.5">
                  <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {results.length > 0 && (
                <div className="absolute z-10 w-full mt-1 rounded-xl overflow-hidden shadow-lg" style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {results.map(u => (
                    <button
                      key={u.id}
                      onClick={() => handlePickPartner(u)}
                      className="w-full text-left px-3 py-2 text-sm text-white/80 transition-colors"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      {u.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleReserve}
            disabled={loading || !partner}
            className="w-full bg-primary text-background text-sm font-semibold py-2 rounded-xl transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Rezerve ediliyor..." : partner ? `${partner.name} ile Rezerve Et` : "Önce arkadaş seç"}
          </button>
        </div>
      )}

      {error && <p className="text-red-400 text-xs mt-2 text-right">{error}</p>}
    </div>
  );
}
