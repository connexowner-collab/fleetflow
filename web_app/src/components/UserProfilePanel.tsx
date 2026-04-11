"use client";

import {
  User,
  KeyRound,
  Bell,
  Shield,
  Palette,
  HelpCircle,
  LogOut,
  X,
  ChevronRight,
  Building2,
  Smartphone,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface UserProfilePanelProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  {
    section: "Conta",
    items: [
      { icon: User, label: "Meu Perfil", description: "Editar dados pessoais" },
      { icon: KeyRound, label: "Alterar Senha", description: "Segurança da conta" },
      { icon: Smartphone, label: "Autenticação em 2 Fatores", description: "MFA / TOTP" },
    ],
  },
  {
    section: "Preferências",
    items: [
      { icon: Bell, label: "Notificações", description: "Alertas e avisos" },
      { icon: Palette, label: "Aparência", description: "Tema e exibição" },
    ],
  },
  {
    section: "Empresa",
    items: [
      { icon: Building2, label: "Minha Empresa", description: "Dados organizacionais" },
      { icon: Shield, label: "Permissões de Acesso", description: "Nível de acesso" },
    ],
  },
  {
    section: "Suporte",
    items: [
      { icon: HelpCircle, label: "Ajuda & Suporte", description: "Central de ajuda" },
    ],
  },
];

const PERFIL_LABEL: Record<string, string> = {
  diretor:  'Diretor',
  gestor:   'Gestor',
  analista: 'Analista',
  motorista:'Motorista',
};

export default function UserProfilePanel({ open, onClose }: UserProfilePanelProps) {
  const user = useCurrentUser();

  const nomeCurto   = user?.nome || user?.email || 'Usuário';
  const iniciais    = nomeCurto.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  const perfilLabel = PERFIL_LABEL[user?.perfil ?? ''] ?? (user?.perfil ?? '—');

  async function logout() {
    await fetch('/api/auth/login', { method: 'DELETE' });
    window.location.href = '/login';
  }

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-700">Perfil do Usuário</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-5 py-5 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold text-lg">
              {iniciais || <User className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{nomeCurto}</p>
              <p className="text-xs text-brand-primary font-medium">FleetFlow</p>
              <p className="text-xs text-gray-400 mt-0.5">{user?.email || '—'}</p>
            </div>
          </div>
          <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
            Ativo · {perfilLabel}
          </div>
        </div>

        {/* Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {menuItems.map((group) => (
            <div key={group.section}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">
                {group.section}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-4 h-4 text-gray-400 group-hover:text-brand-primary transition-colors" />
                        <div className="text-left">
                          <p className="text-sm text-gray-700 font-medium">{item.label}</p>
                          <p className="text-xs text-gray-400">{item.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors group"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Sair da conta</span>
          </button>
        </div>
      </div>
    </>
  );
}
