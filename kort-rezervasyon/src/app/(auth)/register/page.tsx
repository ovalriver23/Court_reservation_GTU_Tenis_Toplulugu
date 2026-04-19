"use client";

import { useState } from "react";
import Link from "next/link";
import { register } from "@/lib/actions/auth";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm") as string;

    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalı.");
      return;
    }

    setLoading(true);
    const result = await register(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl px-6 py-8"
        style={{
          background: "rgba(0,0,0,0.25)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        {/* Logo / Başlık */}
        <div className="mb-8 text-center">
          <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" style={{ width: 52, height: 52, display: "block", margin: "0 auto 16px", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" }}>
            <circle cx="30" cy="30" r="29" fill="#D0FF00" />
            <circle cx="30" cy="30" r="29" fill="none" stroke="#AACC00" strokeWidth="1" />
            <path d="M 8 13 C 20 22, 20 38, 8 47"  stroke="#1a1a1a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M 52 13 C 40 22, 40 38, 52 47" stroke="#1a1a1a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <ellipse cx="20" cy="16" rx="8" ry="5" fill="white" opacity="0.2" transform="rotate(-40 20 16)" />
          </svg>
          <h1 className="text-text-primary text-2xl font-semibold">GTU Tenis</h1>
          <p className="text-white/60 text-sm mt-1">Yeni hesap oluştur</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-1.5" htmlFor="name">
              Ad Soyad
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              className="w-full rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
              placeholder="Adın Soyadın"
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-1.5" htmlFor="email">
              E-posta
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
              placeholder="ad@example.com"
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-1.5" htmlFor="password">
              Şifre
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              className="w-full rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
              placeholder="En az 6 karakter"
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-1.5" htmlFor="confirm">
              Şifre Tekrar
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              autoComplete="new-password"
              className="w-full rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-background font-semibold py-3 rounded-xl transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Kayıt olunuyor..." : "Kayıt Ol"}
          </button>
        </form>

        <p className="text-center text-white/50 text-sm mt-6">
          Zaten hesabın var mı?{" "}
          <Link href="/login" className="text-primary underline underline-offset-2">
            Giriş yap
          </Link>
        </p>
      </div>
    </main>
  );
}
