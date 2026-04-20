"use client"

import { useEffect, useState, useCallback } from 'react'
import { Bell, Info, ClipboardCheck, Wrench, FileText, ChevronLeft, Car } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '../components/BottomNav'

type Categoria =
  | 'NOTIF-01'   // checklist
  | 'NOTIF-02'   // documento
  | 'NOTIF-03'   // manutenção
  | 'NOTIF-04'   // veículo em manutenção
  | 'NOTIF-05'   // vínculo alterado

interface Notificacao {
  id: string
  titulo: string
  descricao: string
  categoria: Categoria
  lida: boolean
  created_at: string
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function categoriaIcon(cat: Categoria) {
  const cls = "w-5 h-5"
  switch (cat) {
    case 'NOTIF-01': return <ClipboardCheck className={cls} />
    case 'NOTIF-02': return <FileText       className={cls} />
    case 'NOTIF-03': return <Wrench         className={cls} />
    case 'NOTIF-04': return <Car            className={cls} />
    case 'NOTIF-05': return <Info           className={cls} />
    default:         return <Bell           className={cls} />
  }
}

function categoriaColor(cat: Categoria) {
  switch (cat) {
    case 'NOTIF-01': return 'bg-blue-600/20 text-blue-400'
    case 'NOTIF-02': return 'bg-purple-600/20 text-purple-400'
    case 'NOTIF-03': return 'bg-orange-600/20 text-orange-400'
    case 'NOTIF-04': return 'bg-yellow-600/20 text-yellow-400'
    case 'NOTIF-05': return 'bg-teal-600/20 text-teal-400'
    default:         return 'bg-slate-700 text-slate-400'
  }
}

function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60_000)
  const hr   = Math.floor(diff / 3_600_000)
  const dia  = Math.floor(diff / 86_400_000)
  if (min < 1)   return 'agora'
  if (min < 60)  return `há ${min} min`
  if (hr  < 24)  return `há ${hr} h`
  if (dia === 1) return 'ontem'
  return `há ${dia} dias`
}

// ─── skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-slate-800 rounded-2xl p-4 border border-slate-700 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-700 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-700 rounded w-3/4" />
              <div className="h-3 bg-slate-700 rounded w-full" />
              <div className="h-3 bg-slate-700 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function NotificacoesPage() {
  const [notifs,  setNotifs]  = useState<Notificacao[]>([])
  const [loading, setLoading] = useState(true)

  const naoLidas = notifs.filter(n => !n.lida).length

  const carregar = useCallback(async () => {
    try {
      const res  = await fetch('/api/notificacoes')
      const json = await res.json()
      const lista: Notificacao[] = json.notificacoes ?? json ?? []
      // ordem decrescente por data
      lista.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setNotifs(lista)
    } catch {
      // mantém estado anterior em caso de erro
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function marcarLida(id: string) {
    // otimistic update
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n))
    try {
      await fetch(`/api/notificacoes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lida: true }),
      })
    } catch {
      // reverte se falhar
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, lida: false } : n))
    }
  }

  async function marcarTodas() {
    const ids = notifs.filter(n => !n.lida).map(n => n.id)
    setNotifs(prev => prev.map(n => ({ ...n, lida: true })))
    try {
      await Promise.all(
        ids.map(id =>
          fetch(`/api/notificacoes/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lida: true }),
          })
        )
      )
    } catch {
      // não reverte — assume que pelo menos algumas foram
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 max-w-md mx-auto">

      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-12 pb-4 bg-slate-900 sticky top-0 z-10 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Link
            href="/app/home"
            className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Voltar"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-white font-bold text-lg">Notificações</h1>
        </div>

        {naoLidas > 0 && (
          <button
            onClick={marcarTodas}
            className="text-blue-400 text-xs font-semibold hover:text-blue-300 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800"
          >
            Marcar todas como lidas
          </button>
        )}
      </header>

      {/* Conteúdo */}
      <main className="flex-1 px-4 py-4 pb-4">

        {loading ? (
          <Skeleton />
        ) : notifs.length === 0 ? (
          /* Estado vazio */
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="bg-slate-800 rounded-full p-5">
              <Bell className="w-8 h-8 text-slate-600" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold">Nenhuma notificação</p>
              <p className="text-slate-500 text-sm mt-1">Você está em dia com tudo!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {notifs.map(notif => (
              <button
                key={notif.id}
                onClick={() => !notif.lida && marcarLida(notif.id)}
                className={`w-full text-left rounded-2xl p-4 border transition-all active:scale-[0.98] ${
                  notif.lida
                    ? 'bg-slate-800/50 border-slate-700/60'
                    : 'bg-slate-800/70 border-l-2 border-l-blue-500 border-slate-700/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Ícone de categoria */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${categoriaColor(notif.categoria)}`}>
                    {categoriaIcon(notif.categoria)}
                  </div>

                  {/* Texto */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold leading-snug ${notif.lida ? 'text-slate-300' : 'text-white'}`}>
                        {notif.titulo}
                      </p>
                      {/* Badge lida/não lida */}
                      {notif.lida ? (
                        <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap mt-0.5 shrink-0">Lida</span>
                      ) : (
                        <span className="text-[10px] bg-blue-600/20 text-blue-400 font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                          Nova
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed line-clamp-2">
                      {notif.descricao}
                    </p>
                    <p className="text-slate-500 text-[10px] mt-2">
                      {tempoRelativo(notif.created_at)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      <BottomNav notifCount={naoLidas} />
    </div>
  )
}
