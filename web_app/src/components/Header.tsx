"use client";

import { useState, useEffect } from "react";
import { Bell, Search, Menu } from "lucide-react";
import UserProfilePanel from "./UserProfilePanel";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen]   = useState(false);
  const [naoLidas, setNaoLidas]       = useState(0);
  const [mounted, setMounted]         = useState(false);
  const user = useCurrentUser();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    async function fetchCount() {
      try {
        const res  = await fetch("/api/notificacoes?nao_lidas=true");
        const json = await res.json();
        setNaoLidas(json.count_nao_lidas ?? 0);
      } catch { /* ignore */ }
    }
    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    return () => clearInterval(interval);
  }, []);

  /* Initials avatar */
  const nome    = mounted ? (user?.nome || user?.email || "U") : "U";
  const initials = nome
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {/* ── Top App Bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 h-16 w-full bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between h-full px-4 md:px-8 max-w-full">

          {/* LEFT — hamburger (desktop) + logo mobile */}
          <div className="flex items-center gap-3">
            {/* Hamburger — sidebar desktop */}
            <button
              onClick={onMenuClick}
              className="hidden md:flex p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-200"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo — visible only on mobile (sidebar hidden) */}
            <Link
              href="/"
              className="md:hidden flex items-center gap-2 select-none"
            >
              <div className="w-8 h-8 overflow-hidden">
                <img
                  src="/logo_v3.png"
                  alt="FleetFlow"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-base font-black tracking-tighter uppercase italic text-gray-900">
                Fleet<span className="text-brand-secondary">Flow</span>
              </span>
            </Link>
          </div>

          {/* CENTER — search bar (desktop) */}
          <div className="hidden md:flex flex-1 mx-8 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all"
              />
            </div>
          </div>

          {/* RIGHT — search icon mobile + bell + avatar */}
          <div className="flex items-center gap-1 md:gap-3">

            {/* Search — mobile icon */}
            <button
              className="md:hidden p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors"
              onClick={() => setSearchOpen(v => !v)}
              aria-label="Buscar"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notification bell */}
            <Link
              href="/notificacoes"
              className="relative p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-200"
            >
              <Bell className="w-5 h-5" />
              {naoLidas > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-white text-[9px] font-bold px-0.5 leading-none">
                  {naoLidas > 99 ? "99+" : naoLidas}
                </span>
              )}
            </Link>

            {/* Avatar */}
            <button
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-2.5 pl-1 md:pl-3 md:border-l md:border-gray-100 cursor-pointer group"
              aria-label="Perfil do usuário"
            >
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary/70 flex items-center justify-center text-white text-xs font-bold shrink-0 ring-2 ring-white shadow-sm group-hover:ring-brand-primary/30 transition-all">
                {mounted ? initials : "—"}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-800 leading-tight">
                  {mounted ? (user?.nome?.split(" ")[0] ?? "Usuário") : "—"}
                </p>
                <p className="text-xs text-brand-primary capitalize leading-tight">
                  {mounted ? (user?.perfil ?? "—") : "—"}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile search expandable */}
        {searchOpen && (
          <div className="md:hidden px-4 pb-3 bg-white/90 backdrop-blur-xl border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                autoFocus
                type="text"
                placeholder="Buscar..."
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all"
              />
            </div>
          </div>
        )}
      </header>

      <UserProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
