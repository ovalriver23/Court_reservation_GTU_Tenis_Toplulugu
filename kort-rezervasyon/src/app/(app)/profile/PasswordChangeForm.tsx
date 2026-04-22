"use client";

import { useState } from "react";
import { changePassword } from "@/lib/actions/auth";

export default function PasswordChangeForm() {
  const [open, setOpen]           = useState(false);
  const [current, setCurrent]     = useState("");
  const [next, setNext]           = useState("");
  const [confirm, setConfirm]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (next.length < 6) { setError("Yeni şifre en az 6 karakter olmalı."); return; }
    if (next !== confirm)  { setError("Yeni şifreler eşleşmiyor."); return; }
    setLoading(true);
    const result = await changePassword(current, next);
    setLoading(false);
    if (result?.error) { setError(result.error); return; }
    setSuccess(true);
    setCurrent(""); setNext(""); setConfirm("");
    setTimeout(() => { setSuccess(false); setOpen(false); }, 2000);
  }

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => { setOpen(o => !o); setError(null); setSuccess(false); }}
        className="w-full flex items-center justify-between px-4 py-4 text-left"
      >
        <span className="text-text-primary font-semibold text-sm">Şifre Değiştir</span>
        <svg
          className={`w-4 h-4 text-text-secondary transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-3 border-t border-border pt-4">
          <div>
            <label className="block text-text-secondary text-xs mb-1.5">Mevcut Şifre</label>
            <input
              type="password"
              required
              value={current}
              onChange={e => setCurrent(e.target.value)}
              autoComplete="current-password"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-text-secondary text-xs mb-1.5">Yeni Şifre</label>
            <input
              type="password"
              required
              value={next}
              onChange={e => setNext(e.target.value)}
              autoComplete="new-password"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-text-secondary text-xs mb-1.5">Yeni Şifre Tekrar</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {error   && <p className="text-red-400 text-xs">{error}</p>}
          {success && <p className="text-primary text-xs font-medium">Şifre güncellendi.</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-background font-semibold py-2.5 rounded-xl text-sm transition-transform active:scale-95 disabled:opacity-50"
          >
            {loading ? "Kaydediliyor..." : "Şifreyi Güncelle"}
          </button>
        </form>
      )}
    </div>
  );
}
