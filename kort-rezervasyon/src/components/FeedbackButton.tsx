"use client";

import { useState, useRef, useEffect } from "react";
import { sendFeedback } from "@/lib/actions/feedback";

export default function FeedbackButton({ userName }: { userName: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await sendFeedback(message, userName);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSent(true);
      setMessage("");
      setTimeout(() => {
        setSent(false);
        setOpen(false);
      }, 2000);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white/70 transition-colors"
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
      >
        Feedback
      </button>

      {open && (
        <div
          className="absolute right-0 top-10 w-72 rounded-2xl p-4 z-50 shadow-xl"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          {sent ? (
            <p className="text-primary text-sm text-center py-4">Teşekkürler! Geri bildiriminiz alındı.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <p className="text-white/50 text-xs">Bir fikrin mi var? Bize söyle.</p>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Mesajını buraya yaz..."
                rows={4}
                required
                className="w-full rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary resize-none transition-colors"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="w-full bg-primary text-background text-sm font-semibold py-2 rounded-xl transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Gönderiliyor..." : "Gönder"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
