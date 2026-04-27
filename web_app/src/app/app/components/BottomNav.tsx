"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Car, ClipboardCheck, User, Wrench, Bell } from 'lucide-react'
import { useEffect, useState } from 'react'

type NavItem = {
  href: string
  icon: React.ElementType
  label: string
  key: string
  always?: boolean
}

const ALL_ITEMS: NavItem[] = [
  { href: '/app/home',        icon: Home,          label: 'Início',    key: 'home',       always: true },
  { href: '/app/dados-ativo', icon: Car,           label: 'Veículo',   key: 'dados_ativo' },
  { href: '/app/checklist',   icon: ClipboardCheck,label: 'Checklist', key: 'checklist'   },
  { href: '/app/manutencao',  icon: Wrench,        label: 'Manutenção',key: 'manutencao'  },
  { href: '/app/notificacoes',icon: Bell,          label: 'Alertas',   key: 'notificacoes'},
  { href: '/app/perfil',      icon: User,          label: 'Perfil',    key: 'perfil',     always: true },
]

export default function BottomNav({ notifCount = 0 }: { notifCount?: number }) {
  const pathname = usePathname()
  const [telas, setTelas] = useState<string[] | null>(null)

  useEffect(() => {
    fetch('/api/auth/profile')
      .then(r => r.json())
      .then(json => {
        const p = json.profile ?? json
        setTelas(p.telas_permitidas ?? null)
      })
      .catch(() => {})
  }, [])

  // While loading, show always-visible items only
  const items = ALL_ITEMS.filter(item => {
    if (item.always) return true
    if (telas === null) return false
    return telas.includes(item.key)
  })

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 pb-safe z-40 max-w-md mx-auto">
      <div className="flex justify-around">
        {items.map(item => {
          const Icon   = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2.5 transition-colors relative ${
                active ? 'text-indigo-600' : 'text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
              {item.key === 'notificacoes' && notifCount > 0 && (
                <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
              )}
              <span className={`text-[10px] font-medium ${active ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
