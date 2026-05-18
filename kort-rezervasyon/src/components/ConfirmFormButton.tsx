"use client";

import { useState } from "react";

interface Props {
  action: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  message?: string;
}

export default function ConfirmFormButton({ action, children, className, message = "Bu işlemi yapmak istediğinden emin misin?" }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-surface border border-border rounded-2xl px-6 py-5 w-full max-w-sm space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-text-primary font-semibold text-sm text-center">{message}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-medium active:scale-95 transition-transform"
              >
                Hayır
              </button>
              <form action={action} className="flex-1">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-semibold active:scale-95 transition-transform"
                >
                  Evet, Sil
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
