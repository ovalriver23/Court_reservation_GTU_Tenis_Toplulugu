"use client";

import { useState } from "react";
import { updateName } from "@/lib/actions/auth";

interface NameChangeFormProps {
  currentName: string;
  nameChangedAt: string | null;
}

function daysUntilAllowed(nameChangedAt: string | null): number {
  if (!nameChangedAt) return 0;
  const daysSince = (Date.now() - new Date(nameChangedAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince >= 30 ? 0 : Math.ceil(30 - daysSince);
}

export default function NameChangeForm({ currentName, nameChangedAt }: NameChangeFormProps) {
  const [open, setOpen]       = useState(false);
  const [name, setName]       = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const daysLeft = daysUntilAllowed(nameChangedAt);
  const locked   = daysLeft > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim() === currentName) { setError("Yeni isim mevcut isimle aynı."); return; }
    setLoading(true);
    setError(null);
    const result = await updateName(name);
    setLoading(false);
    if (result?.error) { setError(result.error); return; }
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setOpen(false); }, 2000);
  }

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => { setOpen(o => !o); setError(null); setSuccess(false); }}
        className="w-full flex items-center justify-between px-4 py-4 text-left"
      >
        <span className="text-text-primary font-semibold text-sm">İsim Değiştir</span>
        <svg
          className={`w-4 h-4 text-text-secondary transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-border pt-4">
          {locked ? (
            <p className="text-text-secondary text-sm">
              İsmini <span className="text-text-primary font-medium">{daysLeft} gün</span> sonra tekrar değiştirebilirsin.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-text-secondary text-xs mb-1.5">Yeni İsim</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  minLength={2}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {error   && <p className="text-red-400 text-xs">{error}</p>}
              {success && <p className="text-primary text-xs font-medium">İsim güncellendi.</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-background font-semibold py-2.5 rounded-xl text-sm transition-transform active:scale-95 disabled:opacity-50"
              >
                {loading ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
