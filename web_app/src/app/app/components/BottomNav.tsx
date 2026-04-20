"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Car, ClipboardCheck, User } from 'lucide-react'

const items = [
  { href: '/app/home',        icon: Home,          label: 'Início'     },
  { href: '/app/dados-ativo', icon: Car,           label: 'Veículo'    },
  { href: '/app/checklist',   icon: ClipboardCheck, label: 'Checklists' },
  { href: '/app/perfil',      icon: User,          label: 'Perfil'     },
]

export default function BottomNav({ notifCount = 0 }: { notifCount?: number }) {
  const pathname = usePathname()
  void notifCount

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
              className={`flex flex-col items-center gap-0.5 px-4 py-2.5 transition-colors ${
                active ? 'text-indigo-600' : 'text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
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
