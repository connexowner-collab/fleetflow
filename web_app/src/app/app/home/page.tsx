"use client"

import { useEffect, useState } from 'react'
import { Truck, Bell, ClipboardCheck, Wrench, FileText, User, ChevronRight, Wifi, WifiOff, LogOut } from 'lucide-react'
import Link from 'next/link'

interface VeiculoCard {
  placa: string
  modelo: string
  marca: string
  status: string
  tipo: string
}

interface UserData {
  nome: string
  email: string
  perfil: string
}

export default function AppHome() {
  const [user, setUser]         = useState<UserData | null>(null)
  const [veiculo, setVeiculo]   = useState<VeiculoCard | null>(null)
  const [loading, setLoading]   = useState(true)
  const [online, setOnline]     = useState(true)
  const [notifs, setNotifs]     = useState(0)

  useEffect(() => {
    // Online/offline detection
    setOnline(navigator.onLine)
    const goOnline  = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online',  goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online',  goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/auth/profile')
        const json = await res.json()
        const profile = json.profile ?? json
        setUser({ nome: profile.nome, email: profile.email, perfil: profile.perfil })

        // Carregar veículo vinculado
        if (profile.veiculo_id) {
          const vRes  = await fetch(`/api/admin/veiculos?id=${profile.veiculo_id}`)
          const vJson = await vRes.json()
          if (vJson.veiculo) setVeiculo(vJson.veiculo)
        }

        // Notificações não lidas
        const nRes  = await fetch('/api/notificacoes?nao_lidas=true')
        const nJson = await nRes.json()
        setNotifs(nJson.count_nao_lidas ?? 0)
      } catch {
        // offline: usar cache se disponível
      } finally {
        setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 5 * 60 * 1000) // atualiza a cada 5 min
    return () => clearInterval(interval)
  }, [])

  async function logout() {
    if (!confirm('Deseja sair do FleetFlow?')) return
    await fetch('/api/auth/login', { method: 'DELETE' })
    window.location.href = '/app/login'
  }

  const STATUS_COLOR: Record<string, string> = {
    Ativo:           'bg-green-500',
    'Em Manutenção': 'bg-yellow-500',
    Inativo:         'bg-gray-500',
    'Em Rota':       'bg-blue-500',
  }

  const menuItems = [
    { href: '/app/checklist', icon: ClipboardCheck, label: 'Checklist Diário',    desc: 'Inspeção do veículo',       color: 'bg-blue-600' },
    { href: '/app/manutencao', icon: Wrench,        label: 'Manutenção',           desc: 'Solicitar ou acompanhar',   color: 'bg-orange-600' },
    { href: '/app/documentos', icon: FileText,       label: 'Dados do Veículo',     desc: 'Documentos e histórico',    color: 'bg-purple-600' },
    { href: '/app/perfil',     icon: User,           label: 'Meu Perfil',           desc: 'Dados e configurações',     color: 'bg-slate-600' },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-slate-900">

      {/* Banner offline */}
      {!online && (
        <div className="bg-yellow-500 text-yellow-900 text-xs text-center py-1.5 px-4 flex items-center justify-center gap-1.5">
          <WifiOff className="w-3.5 h-3.5" />
          Sem conexão — exibindo dados do último acesso
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-12 pb-4">
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-widest">FleetFlow</p>
          {loading ? (
            <div className="h-6 w-32 bg-slate-700 rounded animate-pulse mt-1" />
          ) : (
            <h1 className="text-white font-bold text-lg mt-0.5">
              Olá, {user?.nome?.split(' ')[0] ?? 'Motorista'} 👋
            </h1>
          )}
        </div>
        <div className="flex items-center gap-3">
          {online ? (
            <Wifi className="w-4 h-4 text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-yellow-400" />
          )}
          <Link href="/app/notificacoes" className="relative p-2">
            <Bell className="w-6 h-6 text-slate-300" />
            {notifs > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {notifs > 9 ? '9+' : notifs}
              </span>
            )}
          </Link>
          <button onClick={logout} className="p-2">
            <LogOut className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Card do Veículo */}
      <div className="mx-5 mb-6">
        {loading ? (
          <div className="bg-slate-800 rounded-2xl p-5 animate-pulse">
            <div className="h-4 w-24 bg-slate-700 rounded mb-3" />
            <div className="h-8 w-36 bg-slate-700 rounded mb-2" />
            <div className="h-4 w-48 bg-slate-700 rounded" />
          </div>
        ) : veiculo ? (
          <div className="bg-gradient-to-br from-blue-900 to-slate-800 rounded-2xl p-5 border border-blue-800/50 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600/30 p-2 rounded-xl">
                  <Truck className="w-5 h-5 text-blue-300" />
                </div>
                <span className="text-blue-300 text-xs font-semibold uppercase tracking-wide">Meu Veículo</span>
              </div>
              <span className={`text-xs font-bold text-white px-2.5 py-1 rounded-full ${STATUS_COLOR[veiculo.status] ?? 'bg-slate-600'}`}>
                {veiculo.status}
              </span>
            </div>
            <p className="text-white text-3xl font-bold tracking-widest mb-1">{veiculo.placa}</p>
            <p className="text-slate-300 text-sm">{veiculo.marca} {veiculo.modelo}</p>
            <p className="text-slate-500 text-xs mt-1">{veiculo.tipo}</p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 text-center">
            <Truck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm font-medium">Nenhum veículo vinculado</p>
            <p className="text-slate-500 text-xs mt-1">Consulte seu gestor para vincular um veículo</p>
          </div>
        )}
      </div>

      {/* Menu */}
      <div className="px-5 flex-1">
        <p className="text-slate-500 text-xs uppercase tracking-widest mb-3">Menu</p>
        <div className="grid grid-cols-2 gap-3">
          {menuItems.map(item => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="bg-slate-800 rounded-2xl p-4 border border-slate-700 active:scale-95 transition-transform"
              >
                <div className={`${item.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-white font-semibold text-sm">{item.label}</p>
                <p className="text-slate-400 text-xs mt-0.5">{item.desc}</p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Bottom nav */}
      <nav className="sticky bottom-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 px-6 py-3 pb-safe flex justify-around mt-6">
        {[
          { href: '/app/home',        icon: Truck,          label: 'Início' },
          { href: '/app/checklist',   icon: ClipboardCheck, label: 'Checklist' },
          { href: '/app/manutencao',  icon: Wrench,         label: 'Manutenção' },
          { href: '/app/notificacoes',icon: Bell,           label: 'Alertas' },
        ].map(item => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors">
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
