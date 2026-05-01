"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Truck, ClipboardCheck, AlertTriangle, Settings, LogOut, Users, ArrowLeftRight, X, Wrench, Fuel, MapPin, BarChart2, FileText, Bell } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useCurrentUser();
  const perfil = user?.perfil ?? 'motorista';
  const [mounted, setMounted] = useState(false);
  const [menuConfig, setMenuConfig] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
    async function loadMenuConfig() {
      try {
        const res = await fetch('/api/admin/config?categoria=menu&all=true');
        const json = await res.json();
        const config: Record<string, boolean> = {};
        (json.opcoes ?? []).forEach((opt: any) => {
          config[opt.valor] = opt.ativo;
        });
        setMenuConfig(config);
      } catch (err) {
        console.error('Erro ao carregar menu config:', err);
      }
    }
    loadMenuConfig();

    window.addEventListener('fleetflow:menu-updated', loadMenuConfig);
    return () => window.removeEventListener('fleetflow:menu-updated', loadMenuConfig);
  }, []);

  function goHome() {
    onClose();
    router.push('/');
  }

  const allNavItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['gestor', 'diretor', 'analista', 'motorista'] },
    { href: '/frota', label: 'Gestão da Frota', icon: Truck, roles: ['gestor', 'diretor', 'analista'] },
    { href: '/checklists', label: 'Checklists', icon: ClipboardCheck, roles: ['gestor', 'diretor', 'analista'] },
    { href: '/ocorrencias', label: 'Ocorrências', icon: AlertTriangle, roles: ['gestor', 'diretor', 'analista', 'motorista'] },
    { href: '/manutencao', label: 'Manutenção', icon: Wrench, roles: ['gestor', 'diretor', 'analista'] },
    { href: '/combustivel', label: 'Combustível', icon: Fuel, roles: ['gestor', 'diretor', 'analista'] },
    { href: '/documentos', label: 'Documentos', icon: FileText, roles: ['gestor', 'diretor', 'analista'] },
    { href: '/rastreamento', label: 'Rastreamento', icon: MapPin, roles: ['gestor', 'diretor', 'analista'] },
    { href: '/relatorios', label: 'Relatórios & BI', icon: BarChart2, roles: ['gestor', 'diretor', 'analista'] },
    { href: '/notificacoes', label: 'Notificações', icon: Bell, roles: ['gestor', 'diretor', 'analista'] },
    { href: '/admin/users', label: 'Gestão de Acessos', icon: Users, roles: ['gestor', 'diretor'] },
    { href: '/admin/trocas', label: 'Aprovações de Troca', icon: ArrowLeftRight, roles: ['gestor', 'diretor', 'analista'] },
    { href: '/configuracoes', label: 'Configurações', icon: Settings, roles: ['gestor', 'diretor'] },
  ];

  const navItems = allNavItems.filter(item => {
    const isAllowedByRole = item.roles.includes(perfil);
    // Se o item estiver na config do menu, respeita o status 'ativo'
    // Se não estiver (ainda não inicializado), mostra por padrão
    const isVisibleByConfig = menuConfig[item.label] !== false;
    return isAllowedByRole && isVisibleByConfig;
  });

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
          <button
            onClick={goHome}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer select-none"
            title="Ir para o Dashboard"
          >
            <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
              <img src="/logo_v3.png" alt="FleetFlow" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic">Fleet<span className="text-brand-secondary">Flow</span></span>
          </button>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg hover:bg-sidebar-fg/10 text-sidebar-fg/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {!mounted ? null : navItems.map((item) => {
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
          {mounted && user && (
            <div className="px-4 py-2 mb-2">
              <p className="text-xs text-sidebar-fg/50 truncate">{user.nome || user.email}</p>
              <p className="text-xs text-brand-secondary capitalize">{user.perfil}</p>
            </div>
          )}
          <button
            onClick={async () => {
              await fetch('/api/auth/login', { method: 'DELETE' });
              window.location.href = '/login';
            }}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg hover:bg-sidebar-fg/5 transition-colors text-sidebar-fg/80 hover:text-red-400"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </>
  );
}
