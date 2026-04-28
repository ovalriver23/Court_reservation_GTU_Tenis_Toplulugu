"use client";

import { useState } from "react";
import { sendWarningEmail } from "@/lib/actions/admin";

interface Props {
  userId: string;
  userName: string;
  userEmail: string;
}

export default function WarnUserModal({ userId, userName, userEmail }: Props) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setOpen(false);
    setSubject("");
    setMessage("");
    setError(null);
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await sendWarningEmail(userId, subject, message);

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => handleClose(), 2000);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 border border-primary/40 text-primary/80 text-xs rounded-xl active:scale-95 transition-transform"
      >
        Uyarı Gönder
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
          onClick={handleClose}
        >
          <div
            className="bg-surface border border-border rounded-2xl p-5 w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <p className="text-text-primary font-semibold text-sm">Uyarı Gönder</p>
              <button
                type="button"
                onClick={handleClose}
                className="text-text-secondary hover:text-white p-1 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="bg-background/30 rounded-xl px-3 py-2 mb-4">
              <p className="text-text-primary text-sm font-medium">{userName}</p>
              <p className="text-text-secondary text-xs truncate">{userEmail}</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-text-secondary text-xs">Konu</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  required
                  className="bg-background border border-border rounded-xl px-3 py-2.5 text-text-primary text-sm outline-none focus:border-primary/50"
                  placeholder="Uyarı konusu"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-text-secondary text-xs">Mesaj</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  rows={5}
                  className="bg-background border border-border rounded-xl px-3 py-2.5 text-text-primary text-sm outline-none focus:border-primary/50 resize-none"
                  placeholder="Uyarı mesajını yazın..."
                />
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}
              {success && <p className="text-primary text-xs font-medium">Mesaj gönderildi.</p>}

              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 border border-border text-text-secondary text-sm rounded-xl py-2.5 active:scale-95 transition-transform"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={loading || !subject.trim() || !message.trim()}
                  className="flex-1 bg-primary text-background font-semibold text-sm rounded-xl py-2.5 active:scale-95 transition-transform disabled:opacity-50"
                >
                  {loading ? "Gönderiliyor..." : "Gönder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
