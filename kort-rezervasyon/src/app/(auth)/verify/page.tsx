"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { verifyEmail, resendVerification } from "@/lib/actions/auth";

function VerifyForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [code, setCode]           = useState("");
  const [error, setError]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [resent, setResent]       = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  function startCountdown() {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (code.length < 6) {
      setError("Kodu eksiksiz gir.");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await verifyEmail(email, code);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setResent(false);
    setError(null);
    const result = await resendVerification(email);
    setResending(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setResent(true);
      startCountdown();
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
        {/* Logo */}
        <div className="mb-8 text-center">
          <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"
            style={{ width: 52, height: 52, display: "block", margin: "0 auto 16px",
                     filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" }}>
            <circle cx="30" cy="30" r="29" fill="#D0FF00" />
            <circle cx="30" cy="30" r="29" fill="none" stroke="#AACC00" strokeWidth="1" />
            <path d="M 8 13 C 20 22, 20 38, 8 47" stroke="#1a1a1a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M 52 13 C 40 22, 40 38, 52 47" stroke="#1a1a1a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <ellipse cx="20" cy="16" rx="8" ry="5" fill="white" opacity="0.2" transform="rotate(-40 20 16)" />
          </svg>
          <h1 className="text-white text-2xl font-semibold">E-posta Doğrulama</h1>
          <p className="text-white/60 text-sm mt-2 leading-snug">
            <span className="text-white/80 font-medium">{email}</span>
            {" "}adresine gönderilen 6 haneli kodu gir.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-1.5" htmlFor="code">
              Doğrulama Kodu
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={8}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
              required
              placeholder="000000"
              className="w-full rounded-xl px-4 py-3 text-white text-center text-2xl font-bold tracking-[0.5em] placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {resent && <p className="text-primary text-sm">Kod yeniden gönderildi.</p>}

          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full bg-primary text-background font-semibold py-3 rounded-xl transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Doğrulanıyor..." : "Doğrula"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-white/40 text-sm">
            Kodu almadın mı?{" "}
            {countdown > 0 ? (
              <span className="text-white/30">{countdown}s sonra tekrar gönder</span>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-primary underline underline-offset-2 disabled:opacity-50"
              >
                {resending ? "Gönderiliyor..." : "Yeniden gönder"}
              </button>
            )}
          </p>
        </div>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
