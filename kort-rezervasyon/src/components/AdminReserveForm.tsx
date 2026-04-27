"use client";

import { useState } from "react";
import { adminReserveSlotRange } from "@/lib/actions/admin";

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function generateTimes(slotStart: string, slotEnd: string): { value: string; label: string }[] {
  const times: { value: string; label: string }[] = [];
  const startH = parseInt(slotStart.split(":")[0]);
  const endH   = parseInt(slotEnd.split(":")[0]);
  for (let h = startH; h <= endH; h++) {
    times.push({
      value: `${String(h).padStart(2, "0")}:00`,
      label: `${h}.00 - ${h + 1}.00`,
    });
  }
  return times;
}

export default function AdminReserveForm({ slotStart, slotEnd }: { slotStart: string; slotEnd: string }) {
  const [open, setOpen]           = useState(false);
  const [date, setDate]           = useState(todayString());
  const [startTime, setStartTime] = useState(slotStart);
  const [endTime, setEndTime]     = useState(slotEnd);
  const [name, setName]           = useState("Turnuva");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const times = generateTimes(slotStart, slotEnd);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    const result = await adminReserveSlotRange(date, date, startTime, endTime, name);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccessMsg(`${result.count} slot rezerve edildi.`);
      setTimeout(() => { setSuccessMsg(null); setOpen(false); }, 2000);
    }
  }

  return (
    <div className="mb-4">
      <button
        onClick={() => { setOpen(o => !o); setError(null); setSuccessMsg(null); }}
        className="w-full flex items-center justify-between bg-surface border border-border rounded-2xl px-4 py-3 text-sm text-text-secondary transition-all active:scale-95"
      >
        <span className="font-medium text-text-primary">Manuel Rezervasyon</span>
        <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-2 bg-surface border border-border rounded-2xl px-4 py-4">
          <form onSubmit={handleSubmit} className="space-y-3">

            {/* Tarih */}
            <div>
              <label className="block text-text-secondary text-xs mb-1.5">Tarih</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                style={{ colorScheme: "dark" }}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-text-primary text-sm"
              />
            </div>

            {/* Saat Aralığı */}
            <div>
              <label className="block text-text-secondary text-xs mb-1.5">Saat Aralığı</label>
              <div className="flex gap-2 items-center">
                <select
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="flex-1 bg-background border border-border rounded-xl px-3 py-2.5 text-text-primary text-sm"
                >
                  {times.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <span className="text-text-secondary text-xs shrink-0">—</span>
                <select
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="flex-1 bg-background border border-border rounded-xl px-3 py-2.5 text-text-primary text-sm"
                >
                  {times.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            {/* İsim */}
            <div>
              <label className="block text-text-secondary text-xs mb-1.5">İsim</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Turnuva, Antrenman..."
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-text-primary text-sm"
              />
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}
            {successMsg && <p className="text-primary text-xs font-medium">{successMsg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-background text-sm font-semibold py-2.5 rounded-xl transition-transform active:scale-95 disabled:opacity-50"
            >
              {loading ? "Rezerve ediliyor..." : "Rezerve Et"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
