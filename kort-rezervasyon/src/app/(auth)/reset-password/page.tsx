"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/lib/actions/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalı.");
      return;
    }
    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    setLoading(true);
    const result = await resetPassword(password);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.push("/login");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div
        className="w-full max-w-sm rounded-3xl px-6 py-8"
        style={{
          background: "rgba(0,0,0,0.25)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div className="mb-8 text-center">
          <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"
            style={{ width: 52, height: 52, display: "block", margin: "0 auto 16px",
                     filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" }}>
            <circle cx="30" cy="30" r="29" fill="#D0FF00" />
            <circle cx="30" cy="30" r="29" fill="none" stroke="#AACC00" strokeWidth="1" />
            <path d="M 8 13 C 20 22, 20 38, 8 47"  stroke="#1a1a1a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M 52 13 C 40 22, 40 38, 52 47" stroke="#1a1a1a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <ellipse cx="20" cy="16" rx="8" ry="5" fill="white" opacity="0.2" transform="rotate(-40 20 16)" />
          </svg>
          <h1 className="text-white text-2xl font-semibold">Yeni Şifre</h1>
          <p className="text-white/60 text-sm mt-2">Hesabın için yeni bir şifre belirle.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-1.5" htmlFor="password">
              Yeni Şifre
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="••••••••"
              className="w-full rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-1.5" htmlFor="confirm">
              Yeni Şifre Tekrar
            </label>
            <input
              id="confirm"
              type="password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
              placeholder="••••••••"
              className="w-full rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-background font-semibold py-3 rounded-xl transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Kaydediliyor..." : "Şifreyi Güncelle"}
          </button>
        </form>
      </div>
    </main>
  );
}
