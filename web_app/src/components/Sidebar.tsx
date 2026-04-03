"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Truck, ClipboardCheck, AlertTriangle, Settings, LogOut, Users, ArrowLeftRight, X } from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/frota', label: 'Gestão da Frota', icon: Truck },
    { href: '/checklists', label: 'Checklists', icon: ClipboardCheck },
    { href: '/ocorrencias', label: 'Ocorrências', icon: AlertTriangle },
    { href: '/admin/users', label: 'Gestão de Acessos', icon: Users },
    { href: '/admin/trocas', label: 'Aprovações de Troca', icon: ArrowLeftRight },
    { href: '/configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <div className={`
        w-64 h-screen bg-sidebar-bg text-sidebar-fg flex flex-col fixed left-0 top-0 z-40
        border-r border-sidebar-fg/5 shadow-xl
        transform transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="p-6 flex items-center justify-between border-b border-sidebar-fg/10 bg-sidebar-bg/50 backdrop-blur-xl">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
              <img src="/logo_v3.png" alt="FleetFlow" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic">Fleet<span className="text-brand-secondary">Flow</span></span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg hover:bg-sidebar-fg/10 text-sidebar-fg/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-brand-primary text-white font-semibold shadow-md'
                    : 'text-sidebar-fg/70 hover:bg-sidebar-fg/5 hover:text-sidebar-fg'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-sidebar-fg/40 group-hover:text-sidebar-fg'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-fg/10 mt-auto">
          <Link href="/login" className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg hover:bg-sidebar-fg/5 transition-colors text-sidebar-fg/80 hover:text-red-400">
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </Link>
        </div>
      </div>
    </>
  );
}
