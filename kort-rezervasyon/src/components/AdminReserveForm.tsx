"use client";

import { useState } from "react";
import { adminReserveSlot } from "@/lib/actions/admin";

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function generateTimes(slotStart: string, slotEnd: string): string[] {
  const times: string[] = [];
  const startH = parseInt(slotStart.split(":")[0]);
  const endH   = parseInt(slotEnd.split(":")[0]);
  for (let h = startH; h <= endH; h++) {
    times.push(`${String(h).padStart(2, "0")}:00`);
  }
  return times;
}

export default function AdminReserveForm({ slotStart, slotEnd }: { slotStart: string; slotEnd: string }) {
  const [open, setOpen]     = useState(false);
  const [date, setDate]     = useState(todayString());
  const [time, setTime]     = useState(slotStart);
  const [name, setName]     = useState("Turnuva");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const times = generateTimes(slotStart, slotEnd);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    const result = await adminReserveSlot(date, time, name);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setOpen(false); }, 1500);
    }
  }

  return (
    <div className="mb-4">
      <button
        onClick={() => { setOpen(o => !o); setError(null); setSuccess(false); }}
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
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-text-secondary text-xs mb-1.5">Tarih</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-text-primary text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-text-secondary text-xs mb-1.5">Saat</label>
                <select
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-text-primary text-sm"
                >
                  {times.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

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
            {success && <p className="text-primary text-xs font-medium">Rezervasyon oluşturuldu.</p>}

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
