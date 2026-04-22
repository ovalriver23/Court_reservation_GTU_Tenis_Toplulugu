"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { login } from "@/lib/actions/auth";
import AnimatedBall from "@/components/AnimatedBall";

function LoginForm() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error") === "link_expired"
    ? "Şifre sıfırlama bağlantısının süresi dolmuş. Lütfen tekrar talep et."
    : null;
  const [error, setError] = useState<string | null>(urlError);
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
        {/* Logo / Başlık */}
        <div className="mb-8 text-center">
          <AnimatedBall />
          <h1 className="text-white text-2xl font-semibold">GTU Tenis</h1>
          <p className="text-white/60 text-sm mt-1">Kort Rezervasyon Sistemi</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
              autoComplete="current-password"
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
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/forgot-password" className="text-white/40 text-sm underline underline-offset-2">
            Şifremi unuttum
          </Link>
        </div>

        <p className="text-center text-white/50 text-sm mt-4">
          Hesabın yok mu?{" "}
          <Link href="/register" className="text-primary underline underline-offset-2">
            Kayıt ol
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
