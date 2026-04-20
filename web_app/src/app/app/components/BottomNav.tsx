"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ClipboardCheck, Wrench, Bell, User, FileText } from 'lucide-react'

const items = [
  { href: '/app/home',        icon: Home,          label: 'Início' },
  { href: '/app/checklist',   icon: ClipboardCheck, label: 'Checklist' },
  { href: '/app/dados-ativo', icon: FileText,       label: 'Ativo' },
  { href: '/app/manutencao',  icon: Wrench,         label: 'Manutenção' },
  { href: '/app/notificacoes',icon: Bell,           label: 'Alertas' },
  { href: '/app/perfil',      icon: User,           label: 'Perfil' },
]

export default function BottomNav({ notifCount = 0 }: { notifCount?: number }) {
  const pathname = usePathname()

  return (
    <nav className="sticky bottom-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 px-2 py-2 pb-safe flex justify-around">
      {items.map(item => {
        const Icon = item.icon
        const active = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors relative ${
              active ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Icon className="w-5 h-5" />
            {item.href === '/app/notificacoes' && notifCount > 0 && (
              <span className="absolute -top-1 right-0 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
            <span className="text-[9px] font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
