"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

type EnrollStep = "idle" | "qr" | "verifying";

export default function MfaSection() {
  const supabase = useMemo(() => createClient(), []);

  const [enrolled, setEnrolled]   = useState(false);
  const [factorId, setFactorId]   = useState<string | null>(null);
  const [step, setStep]           = useState<EnrollStep>("idle");
  const [qrCode, setQrCode]       = useState<string | null>(null);
  const [secret, setSecret]       = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [code, setCode]           = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [checkDone, setCheckDone] = useState(false);

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const verified = data?.totp?.find(f => f.status === "verified");
      if (verified) { setEnrolled(true); setFactorId(verified.id); }
      setCheckDone(true);
    });
  }, [supabase]);

  async function handleEnroll() {
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setLoading(false);
    if (error || !data) { setError("2FA başlatılamadı."); return; }
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setPendingId(data.id);
    setStep("qr");
  }

  async function handleVerify() {
    if (!pendingId) return;
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: pendingId, code });
    setLoading(false);
    if (error) { setError("Kod hatalı. Tekrar dene."); return; }
    setEnrolled(true);
    setFactorId(pendingId);
    setStep("idle");
    setCode("");
    setQrCode(null);
    setSecret(null);
  }

  async function handleUnenroll() {
    if (!factorId) return;
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setLoading(false);
    if (error) { setError("Devre dışı bırakılamadı."); return; }
    setEnrolled(false);
    setFactorId(null);
  }

  function handleCancel() {
    setStep("idle");
    setQrCode(null);
    setSecret(null);
    setCode("");
    setError(null);
  }

  if (!checkDone) return null;

  return (
    <div className="bg-surface border border-border rounded-2xl px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-primary font-semibold text-sm">İki Faktörlü Doğrulama</p>
          <p className="text-text-secondary text-xs mt-0.5">
            {enrolled ? "Etkin — Google Authenticator ile" : "Devre dışı"}
          </p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          enrolled ? "bg-primary/15 text-primary" : "bg-border/40 text-text-secondary"
        }`}>
          {enrolled ? "Açık" : "Kapalı"}
        </span>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {/* Kayıt adımı: QR kod göster */}
      {step === "qr" && qrCode && (
        <div className="space-y-3">
          <p className="text-text-secondary text-xs leading-relaxed">
            Google Authenticator veya Authy uygulamasıyla QR kodu tara, ardından üretilen 6 haneli kodu gir.
          </p>
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCode} alt="2FA QR Kodu" className="w-40 h-40 rounded-xl" />
          </div>
          {secret && (
            <p className="text-text-secondary text-xs text-center break-all">
              Manuel giriş: <span className="text-text-primary font-mono">{secret}</span>
            </p>
          )}
          <div>
            <label className="block text-text-secondary text-xs mb-1.5">Doğrulama Kodu</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-text-primary text-sm text-center font-bold tracking-widest focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleVerify}
              disabled={loading || code.length !== 6}
              className="flex-1 bg-primary text-background font-semibold py-2.5 rounded-xl text-sm transition-transform active:scale-95 disabled:opacity-50"
            >
              {loading ? "Doğrulanıyor..." : "Etkinleştir"}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 border border-border text-text-secondary text-sm rounded-xl active:scale-95 transition-transform"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Normal durum butonları */}
      {step === "idle" && (
        enrolled ? (
          <button
            onClick={handleUnenroll}
            disabled={loading}
            className="w-full border border-border text-text-secondary font-medium py-2.5 rounded-xl text-sm transition-transform active:scale-95 disabled:opacity-50"
          >
            {loading ? "İşleniyor..." : "Devre Dışı Bırak"}
          </button>
        ) : (
          <button
            onClick={handleEnroll}
            disabled={loading}
            className="w-full bg-primary text-background font-semibold py-2.5 rounded-xl text-sm transition-transform active:scale-95 disabled:opacity-50"
          >
            {loading ? "Başlatılıyor..." : "2FA Etkinleştir"}
          </button>
        )
      )}
    </div>
  );
}
