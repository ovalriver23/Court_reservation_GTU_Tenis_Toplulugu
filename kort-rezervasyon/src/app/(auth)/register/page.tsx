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
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Başlık */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary mb-4">
            <span className="text-background font-bold text-xl">T</span>
          </div>
          <h1 className="text-text-primary text-2xl font-semibold">GTU Tenis</h1>
          <p className="text-text-secondary text-sm mt-1">Yeni hesap oluştur</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-text-secondary text-sm mb-1.5" htmlFor="name">
              Ad Soyad
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary transition-colors"
              placeholder="Adın Soyadın"
            />
          </div>

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
              autoComplete="new-password"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary transition-colors"
              placeholder="En az 6 karakter"
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-1.5" htmlFor="confirm">
              Şifre Tekrar
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              autoComplete="new-password"
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
            {loading ? "Kayıt olunuyor..." : "Kayıt Ol"}
          </button>
        </form>

        <p className="text-center text-text-secondary text-sm mt-6">
          Zaten hesabın var mı?{" "}
          <Link href="/login" className="text-primary underline underline-offset-2">
            Giriş yap
          </Link>
        </p>
      </div>
    </main>
  );
}
