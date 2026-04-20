"use client"

import { useEffect, useState, useCallback } from 'react'
import { Truck, Wifi, WifiOff, LogOut, RefreshCw, ClipboardCheck } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '../components/BottomNav'

interface VeiculoCard {
  placa: string
  modelo: string
  marca: string
  status: string
  tipo: string
  km_atual: number
}

interface UserData {
  nome: string
  email: string
  perfil: string
}

interface SolicitacaoPendente {
  placa: string
  solicitante: string
  data: string
}

const STATUS_COLOR: Record<string, string> = {
  Ativo:           'bg-green-500',
  'Em Manutenção': 'bg-yellow-500',
  Inativo:         'bg-gray-500',
  'Em Rota':       'bg-blue-500',
  Disponível:      'bg-green-500',
}

export default function AppHome() {
  const [user, setUser]               = useState<UserData | null>(null)
  const [veiculo, setVeiculo]         = useState<VeiculoCard | null>(null)
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [online, setOnline]           = useState(true)
  const [notifs, setNotifs]           = useState(0)
  const [solicitacao, setSolicitacao] = useState<SolicitacaoPendente | null>(null)
  const [showSolicitacao, setShowSolicitacao] = useState(false)

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const [profRes, notifRes] = await Promise.all([
        fetch('/api/auth/profile'),
        fetch('/api/notificacoes?nao_lidas=true'),
      ])
      const profJson = await profRes.json()
      const profile = profJson.profile ?? profJson

      if (profile.nome) {
        setUser({ nome: profile.nome, email: profile.email, perfil: profile.perfil })
      }

      // Veículo via API do APP
      if (profile.placa_vinculada || profile.veiculo_id) {
        const vRes = await fetch('/api/app/veiculo')
        const vJson = await vRes.json()
        if (vJson.veiculo) setVeiculo(vJson.veiculo)
        else setVeiculo(null)
      } else {
        setVeiculo(null)
      }

      const notifJson = await notifRes.json()
      setNotifs(notifJson.count_nao_lidas ?? 0)

      // Verificar solicitação de checklist pendente
      if (profile.solicitacao_checklist_pendente) {
        setSolicitacao(profile.solicitacao_checklist_pendente)
        setShowSolicitacao(true)
      }
    } catch {
      // offline — mantém cache
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    setOnline(navigator.onLine)
    const goOnline  = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online',  goOnline)
    window.addEventListener('offline', goOffline)

    // Polling a cada 5 minutos conforme spec D-04 v2
    const interval = setInterval(() => load(), 5 * 60 * 1000)
    return () => {
      window.removeEventListener('online',  goOnline)
      window.removeEventListener('offline', goOffline)
      clearInterval(interval)
    }
  }, [load])

  async function logout() {
    if (!confirm('Deseja sair do FleetFlow?')) return
    await fetch('/api/auth/login', { method: 'DELETE' })
    window.location.href = '/app/login'
  }

  const menuItems = [
    { href: '/app/checklist',   icon: '✅', label: 'Checklist',       desc: 'Inspeção diária',          color: 'bg-blue-600' },
    { href: '/app/dados-ativo', icon: '🚛', label: 'Dados do Ativo',  desc: 'Documentos e dados',       color: 'bg-purple-600' },
    { href: '/app/manutencao',  icon: '🔧', label: 'Manutenção',      desc: 'Solicitar ou acompanhar',  color: 'bg-orange-600' },
    { href: '/app/notificacoes',icon: '🔔', label: 'Notificações',    desc: 'Alertas e avisos',         color: 'bg-slate-600' },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-slate-900">

      {/* Modal bloqueante de solicitação de checklist */}
      {showSolicitacao && solicitacao && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-5">
          <div className="bg-slate-800 rounded-2xl p-6 border border-yellow-500/50 w-full max-w-sm">
            <div className="text-center mb-4">
              <div className="bg-yellow-500/20 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-3">
                <ClipboardCheck className="w-7 h-7 text-yellow-400" />
              </div>
              <h2 className="text-white font-bold text-lg">Checklist Solicitado</h2>
              <p className="text-slate-400 text-sm mt-1">Um checklist foi solicitado para o veículo</p>
            </div>
            <div className="bg-slate-700 rounded-xl p-4 space-y-2 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Veículo</span>
                <span className="text-white font-bold">{solicitacao.placa}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Solicitante</span>
                <span className="text-white">{solicitacao.solicitante}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Data</span>
                <span className="text-white">{new Date(solicitacao.data).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
            <Link
              href="/app/checklist"
              onClick={() => setShowSolicitacao(false)}
              className="block w-full bg-blue-600 text-white text-center font-semibold rounded-xl py-3 mb-2"
            >
              Realizar Checklist Agora
            </Link>
            <button
              onClick={() => setShowSolicitacao(false)}
              className="w-full text-slate-400 text-sm py-2"
            >
              Fazer depois
            </button>
          </div>
        </div>
      )}

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
          {online ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-yellow-400" />}
          <button onClick={() => load(true)} className="p-1.5" title="Atualizar">
            <RefreshCw className={`w-4 h-4 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
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
            <div className="flex items-center justify-between mt-3">
              <p className="text-slate-500 text-xs">{veiculo.tipo}</p>
              {veiculo.km_atual > 0 && (
                <p className="text-slate-400 text-xs">{veiculo.km_atual.toLocaleString('pt-BR')} km</p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 text-center">
            <Truck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm font-medium">Nenhum veículo vinculado</p>
            <p className="text-slate-500 text-xs mt-1">Consulte seu gestor para vincular um veículo</p>
          </div>
        )}
      </div>

      {/* Menu rápido */}
      <div className="px-5 flex-1">
        <p className="text-slate-500 text-xs uppercase tracking-widest mb-3">Acesso Rápido</p>
        <div className="grid grid-cols-2 gap-3">
          {menuItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-slate-800 rounded-2xl p-4 border border-slate-700 active:scale-95 transition-transform"
            >
              <div className={`${item.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-lg`}>
                {item.icon}
              </div>
              <p className="text-white font-semibold text-sm">{item.label}</p>
              <p className="text-slate-400 text-xs mt-0.5">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <BottomNav notifCount={notifs} />
      </div>
    </div>
  )
}
