"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function MfaChallengePage() {
  const [code, setCode]       = useState("");
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const totp = data?.totp?.find(f => f.status === "verified");
      if (totp) setFactorId(totp.id);
    });
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setLoading(true);

    const { error: challengeError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });

    if (challengeError) {
      setError("Kod hatalı veya süresi dolmuş.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
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
          <h1 className="text-white text-2xl font-semibold">İki Faktörlü Doğrulama</h1>
          <p className="text-white/60 text-sm mt-2 leading-snug">
            Authenticator uygulamasındaki 6 haneli kodu gir.
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
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              placeholder="000000"
              className="w-full rounded-xl px-4 py-3 text-white text-center text-2xl font-bold tracking-[0.5em] placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || code.length !== 6 || !factorId}
            className="w-full bg-primary text-background font-semibold py-3 rounded-xl transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Doğrulanıyor..." : "Doğrula"}
          </button>
        </form>
      </div>
    </main>
  );
}
