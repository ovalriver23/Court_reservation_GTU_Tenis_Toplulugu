"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/lib/theme";
import { logout } from "@/lib/actions/auth";

const BASE_NAV_ITEMS = [
  { href: "/", label: "Takvim", icon: CalendarIcon },
  { href: "/reservations", label: "Rezervasyonlarım", icon: ListIcon },
  { href: "/profile", label: "Profil", icon: UserIcon },
];

export default function HamburgerMenu({ isAdmin = false }: { isAdmin?: boolean }) {
  const [open, setOpen] = useState(false);
  const [rotating, setRotating] = useState(false);
  const pathname = usePathname();
  const { nextTheme } = useTheme();

  const navItems = isAdmin
    ? [...BASE_NAV_ITEMS, { href: "/admin", label: "Admin Panel", icon: ShieldIcon }]
    : BASE_NAV_ITEMS;

  function handleBallClick() {
    if (rotating) return;
    setRotating(true);
    nextTheme();
    setTimeout(() => setRotating(false), 600);
  }

  return (
    <>
      {/* Hamburger butonu */}
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-xl text-text-primary transition-transform active:scale-95"
        aria-label="Menüyü aç"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-surface z-50 flex flex-col
          transition-transform duration-250 ease-out
          ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 pt-12 pb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBallClick}
              className="cursor-pointer transition-transform active:scale-95"
              style={{
                transform: rotating ? "rotate(360deg)" : "rotate(0deg)",
                transition: rotating ? "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)" : "none",
              }}
              aria-label="Temayı değiştir"
            >
              <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" width="32" height="32" style={{ display: "block", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))" }}>
                <circle cx="30" cy="30" r="29" fill="#D0FF00" />
                <circle cx="30" cy="30" r="29" fill="none" stroke="#AACC00" strokeWidth="1" />
                <path d="M 8 13 C 20 22, 20 38, 8 47"  stroke="#1a1a1a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                <path d="M 52 13 C 40 22, 40 38, 52 47" stroke="#1a1a1a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                <ellipse cx="20" cy="16" rx="8" ry="5" fill="white" opacity="0.2" transform="rotate(-40 20 16)" />
              </svg>
            </button>
            <span className="text-text-primary font-semibold">GTU Tenis</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 text-text-secondary transition-transform active:scale-95"
            aria-label="Menüyü kapat"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav linkleri */}
        <nav className="flex-1 px-3">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all active:scale-[0.98]
                  ${isActive
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:text-text-primary"
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Çıkış */}
        <div className="px-3 pb-10">
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary transition-all active:scale-[0.98]"
            >
              <LogoutIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Çıkış Yap</span>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}
