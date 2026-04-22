"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/actions/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await forgotPassword(email);
    setLoading(false);
    if (result?.error) setError(result.error);
    else setSent(true);
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
          <h1 className="text-white text-2xl font-semibold">Şifremi Unuttum</h1>
          <p className="text-white/60 text-sm mt-2 leading-snug">
            E-posta adresini gir, sıfırlama bağlantısı gönderelim.
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-primary text-sm font-medium">
              E-posta gönderildi! Gelen kutunu kontrol et.
            </p>
            <Link href="/login" className="block text-white/50 text-sm underline underline-offset-2">
              Giriş sayfasına dön
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm mb-1.5" htmlFor="email">
                E-posta
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="ad@example.com"
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
              {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
            </button>
          </form>
        )}

        <p className="text-center text-white/50 text-sm mt-6">
          <Link href="/login" className="underline underline-offset-2">
            Giriş sayfasına dön
          </Link>
        </p>
      </div>
    </main>
  );
}
