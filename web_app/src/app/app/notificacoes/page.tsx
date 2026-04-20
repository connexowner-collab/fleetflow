"use client"

import { useEffect, useState, useCallback } from 'react'
import { Bell, ClipboardCheck, AlertTriangle, FileText, Settings, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import BottomNav from '../components/BottomNav'

interface Notif {
  id: string; titulo: string; mensagem: string
  categoria: string; lida: boolean; created_at: string
}

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60000)
  if (min < 1)  return 'AGORA'
  if (min < 60) return `${min}MIN`
  const h = Math.floor(min / 60)
  if (h < 24)   return `${h}H ATRÁS`
  const d = Math.floor(h / 24)
  return d === 1 ? 'ONTEM' : `${d}D ATRÁS`
}

function CatIcon({ cat }: { cat: string }) {
  const base = 'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0'
  if (cat === 'checklist')  return <div className={`${base} bg-indigo-50`}><ClipboardCheck className="w-5 h-5 text-indigo-600" /></div>
  if (cat === 'documento')  return <div className={`${base} bg-orange-50`}><AlertTriangle className="w-5 h-5 text-orange-500" /></div>
  if (cat === 'manutencao') return <div className={`${base} bg-yellow-50`}><Settings className="w-5 h-5 text-yellow-600" /></div>
  if (cat === 'sistema')    return <div className={`${base} bg-blue-50`}><Bell className="w-5 h-5 text-blue-600" /></div>
  return <div className={`${base} bg-gray-100`}><FileText className="w-5 h-5 text-gray-500" /></div>
}

export default function NotificacoesPage() {
  const router = useRouter()
  const [notifs,  setNotifs]  = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res  = await fetch('/api/notificacoes?limit=50')
      const json = await res.json()
      setNotifs(json.notificacoes ?? [])
    } catch { /* offline */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function marcarLida(id: string) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n))
    await fetch(`/api/notificacoes/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lida: true }) })
  }

  async function marcarTodas() {
    setNotifs(prev => prev.map(n => ({ ...n, lida: true })))
    await fetch('/api/notificacoes/mark-all', { method: 'PATCH' })
  }

  const recentes   = notifs.filter(n => !n.lida)
  const anteriores = notifs.filter(n =>  n.lida)

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F6FB] pb-20">

      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="p-1.5 bg-gray-100 rounded-xl">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg,#4B3FE4,#7C3AED)' }}>
              <Bell className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">FleetFlow</span>
          </div>
          <Bell className="w-5 h-5 text-gray-400" />
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
            <p className="text-gray-500 text-sm mt-0.5">Fique por dentro das atualizações da sua frota.</p>
          </div>
          {recentes.length > 0 && (
            <button onClick={marcarTodas} className="text-indigo-600 text-xs font-bold text-right leading-tight mt-1">
              MARCAR TODAS<br />COMO LIDAS
            </button>
          )}
        </div>
      </div>

      <div className="px-5 pt-4 space-y-4">
        {loading && [1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />)}

        {!loading && recentes.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Recentes</p>
            <div className="space-y-2">
              {recentes.map(n => (
                <button key={n.id} onClick={() => marcarLida(n.id)}
                  className="w-full bg-white rounded-2xl p-4 text-left shadow-sm border-l-4 border-l-indigo-500 border border-gray-100 flex items-start gap-3 active:scale-[.98] transition-transform">
                  <div className="relative">
                    <CatIcon cat={n.categoria} />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-gray-900 font-semibold text-sm truncate">{n.titulo}</p>
                      <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">{fmtRelative(n.created_at)}</span>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{n.mensagem}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {!loading && anteriores.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Anteriores</p>
            <div className="space-y-2">
              {anteriores.map(n => (
                <div key={n.id} className="bg-white/60 rounded-2xl p-4 flex items-start gap-3 border border-gray-100">
                  <CatIcon cat={n.categoria} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-gray-500 font-medium text-sm truncate">{n.titulo}</p>
                      <span className="text-[10px] font-bold text-gray-300 whitespace-nowrap">{fmtRelative(n.created_at)}</span>
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{n.mensagem}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && notifs.length === 0 && (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
            <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhuma notificação</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
