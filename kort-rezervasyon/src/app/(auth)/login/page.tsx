"use client";

import { useState } from "react";
import Link from "next/link";
import { login } from "@/lib/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Başlık */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary mb-4">
            <span className="text-background font-bold text-xl">T</span>
          </div>
          <h1 className="text-text-primary text-2xl font-semibold">GTU Tenis</h1>
          <p className="text-text-secondary text-sm mt-1">Kort Rezervasyon Sistemi</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-text-secondary text-sm mb-1.5" htmlFor="email">
              E-posta
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary transition-colors"
              placeholder="ad@example.com"
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-1.5" htmlFor="password">
              Şifre
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary transition-colors"
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
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <p className="text-center text-text-secondary text-sm mt-6">
          Hesabın yok mu?{" "}
          <Link href="/register" className="text-primary underline underline-offset-2">
            Kayıt ol
          </Link>
        </p>
      </div>
    </main>
  );
}
