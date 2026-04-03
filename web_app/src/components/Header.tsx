"use client";

import { useState } from "react";
import { Bell, Search, User, Menu } from "lucide-react";
import UserProfilePanel from "./UserProfilePanel";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <header className="h-16 md:h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 w-full">
        <div className="flex items-center gap-3">
          {/* Hamburger mobile */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search bar */}
          <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 w-48 sm:w-72 md:w-96 focus-within:ring-2 focus-within:ring-brand-primary">
            <Search className="w-4 h-4 md:w-5 md:h-5 text-gray-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Buscar..."
              className="bg-transparent border-none outline-none w-full text-sm text-gray-700 placeholder-gray-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3 md:space-x-6">
          <button className="relative text-gray-500 hover:text-brand-primary transition-colors">
            <Bell className="w-5 h-5 md:w-6 md:h-6" />
            <span className="absolute top-0 right-0 w-2 h-2 md:w-2.5 md:h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
          </button>

          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center space-x-2 md:space-x-3 md:border-l md:border-gray-200 md:pl-6 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 bg-brand-primary/20 rounded-full flex items-center justify-center text-brand-primary font-bold">
              <User className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-gray-800">João Gestor</p>
              <p className="text-xs text-brand-primary">ViaCargas Transportes</p>
            </div>
          </button>
        </div>
      </header>

      <UserProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
