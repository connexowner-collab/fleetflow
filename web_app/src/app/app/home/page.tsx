"use client"

import { useEffect, useState, useCallback } from 'react'
import { Bell, RefreshCw, LogOut, PlayCircle, History, Car, CheckCircle2, ClipboardCheck, AlertTriangle, XCircle } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '../components/BottomNav'

interface Documento { tipo: string; vencimento: string | null }
interface Veiculo {
  placa: string; modelo: string; marca: string; status: string
  tipo: string; km_atual: number; cor: string; ano_fabricacao: number
}
interface UserData { nome: string; email: string; perfil: string }

function calcDocStatus(docs: Documento[]): 'ok' | 'alerta' | 'vencido' | 'sem_dados' {
  if (!docs.length) return 'sem_dados'
  let pior: 'ok' | 'alerta' | 'vencido' | 'sem_dados' = 'ok'
  for (const d of docs) {
    if (!d.vencimento) continue
    const dias = Math.floor((new Date(d.vencimento).getTime() - Date.now()) / 86400000)
    if (dias < 0) return 'vencido'
    if (dias < 30 && (pior as string) !== 'vencido') pior = 'alerta'
  }
  return pior
}

function DocIndicator({ status }: { status: 'ok' | 'alerta' | 'vencido' | 'sem_dados' }) {
  if (status === 'ok')
    return <span className="bg-green-400/90 text-green-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Docs OK</span>
  if (status === 'alerta')
    return <span className="bg-yellow-400/90 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Doc Vencendo</span>
  if (status === 'vencido')
    return <span className="bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" />Doc Vencido</span>
  return null
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() ?? ''
  if (s.includes('manutenção') || s.includes('manutencao'))
    return <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit"><AlertTriangle className="w-3 h-3" />{status}</span>
  if (s.includes('uso'))
    return <span className="bg-blue-400 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit"><Car className="w-3 h-3" />{status}</span>
  return <span className="bg-green-400 text-green-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" />{status}</span>
}

interface Solicitacao { id: string; solicitante_nome: string; placa: string | null; created_at: string }

async function registrarPushSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
  try {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) return
    const reg = await navigator.serviceWorker.ready
    const existing = await reg.pushManager.getSubscription()
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey,
    })
    await fetch('/api/app/push-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub.toJSON()),
    })
  } catch { /* ignorar erros de permissão */ }
}

export default function AppHome() {
  const [user,        setUser]       = useState<UserData | null>(null)
  const [veiculo,     setVeiculo]    = useState<Veiculo | null>(null)
  const [documentos,  setDocumentos] = useState<Documento[]>([])
  const [loading,     setLoading]    = useState(true)
  const [refreshing,  setRefreshing] = useState(false)
  const [notifs,      setNotifs]     = useState(0)
  const [solicitacao, setSolicitacao]= useState<Solicitacao | null>(null)

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const [profRes, notifRes] = await Promise.all([
        fetch('/api/auth/profile'),
        fetch('/api/notificacoes?nao_lidas=true'),
      ])
      const profJson = await profRes.json()
      const profile  = profJson.profile ?? profJson
      if (profile.nome) setUser({ nome: profile.nome, email: profile.email, perfil: profile.perfil })

      if (profile.placa_vinculada || profile.veiculo_id) {
        const vRes  = await fetch('/api/app/veiculo')
        const vJson = await vRes.json()
        setVeiculo(vJson.veiculo ?? null)
        setDocumentos(vJson.documentos ?? [])
      } else {
        setVeiculo(null)
        setDocumentos([])
      }

      const notifJson = await notifRes.json()
      setNotifs(notifJson.count_nao_lidas ?? 0)
    } catch { /* offline */ } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const checkSolicitacao = useCallback(async () => {
    try {
      const res  = await fetch('/api/app/checklist-solicitacao')
      const json = await res.json()
      setSolicitacao(json.solicitacao ?? null)
    } catch { /* offline */ }
  }, [])

  useEffect(() => {
    load()
    checkSolicitacao()
    registrarPushSubscription()
    const interval = setInterval(() => { load(); checkSolicitacao() }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [load, checkSolicitacao])

  async function logout() {
    if (!confirm('Deseja sair do FleetFlow?')) return
    await fetch('/api/auth/login', { method: 'DELETE' })
    window.location.href = '/app/login'
  }

  const nome     = user?.nome?.split(' ')[0] ?? 'Motorista'
  const docStatus = calcDocStatus(documentos)

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F6FB] pb-20">

      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg,#4B3FE4,#7C3AED)' }}>
            <Car className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-base">FleetFlow</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(true)} className="p-2">
            <RefreshCw className={`w-4 h-4 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <Link href="/app/notificacoes" className="relative p-2">
            <Bell className="w-5 h-5 text-gray-600" />
            {notifs > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {notifs > 9 ? '9+' : notifs}
              </span>
            )}
          </Link>
          <button onClick={logout} className="p-1">
            <LogOut className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-4">

        {/* Saudação */}
        {loading ? (
          <div className="h-10 bg-gray-200 rounded-xl animate-pulse" />
        ) : (
          <div>
            <p className="text-gray-500 text-sm">Bem-vindo de volta,</p>
            <h1 className="text-2xl font-bold text-gray-900">Olá, {nome}</h1>
          </div>
        )}

        {/* Card do Veículo */}
        {loading ? (
          <div className="bg-white rounded-3xl h-56 animate-pulse" />
        ) : veiculo ? (
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
            {/* Banner */}
            <div className="relative h-36 w-full overflow-hidden"
                 style={{ background: 'linear-gradient(135deg, #4B3FE4 0%, #7C3AED 60%, #A78BFA 100%)' }}>
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <Car className="w-28 h-28 text-white" />
              </div>
              {/* Status + Doc */}
              <div className="absolute bottom-3 left-4 flex gap-2 flex-wrap">
                <StatusBadge status={veiculo.status} />
                <DocIndicator status={docStatus} />
              </div>
              {/* Refresh */}
              <div className="absolute top-3 right-3">
                <button onClick={() => load(true)} className="bg-white/20 p-1.5 rounded-lg">
                  <RefreshCw className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
              {/* Nome + Placa */}
              <div className="absolute bottom-10 left-4">
                <p className="text-white font-bold text-lg">{veiculo.marca} {veiculo.modelo}</p>
                <p className="text-white/80 text-sm font-semibold tracking-widest">{veiculo.placa}</p>
              </div>
              {/* Pills */}
              <div className="absolute bottom-3 right-4 flex gap-1.5">
                {veiculo.cor && (
                  <span className="bg-black/30 text-white/90 text-[10px] font-medium px-2 py-0.5 rounded-full">{veiculo.cor}</span>
                )}
                {veiculo.ano_fabricacao && (
                  <span className="bg-black/30 text-white/90 text-[10px] font-medium px-2 py-0.5 rounded-full">{veiculo.ano_fabricacao}</span>
                )}
                {veiculo.tipo && (
                  <span className="bg-black/30 text-white/90 text-[10px] font-medium px-2 py-0.5 rounded-full">{veiculo.tipo}</span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100">
              <div className="p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">KM Atual</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">{veiculo.km_atual.toLocaleString('pt-BR')} km</p>
              </div>
              <div className="p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tipo</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">{veiculo.tipo || '—'}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100">
            <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhum veículo vinculado</p>
            <p className="text-gray-400 text-xs mt-1">Consulte seu gestor</p>
          </div>
        )}

        {/* Ações rápidas */}
        {veiculo && (
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/app/checklist"
              className="text-white font-bold rounded-2xl py-4 px-4 flex items-center gap-2 justify-center text-sm active:scale-[.97] transition-transform"
              style={{ background: 'linear-gradient(135deg,#4B3FE4,#7C3AED)' }}
            >
              <PlayCircle className="w-5 h-5" />
              Iniciar Checklist
            </Link>
            <Link
              href="/app/dados-ativo"
              className="bg-indigo-50 text-indigo-600 font-bold rounded-2xl py-4 px-4 flex items-center gap-2 justify-center text-sm active:scale-[.97] transition-transform border border-indigo-100"
            >
              <History className="w-5 h-5" />
              Dados do Ativo
            </Link>
          </div>
        )}

        {/* Ações secundárias */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/app/manutencao"
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[.97] transition-transform">
            <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center mb-2">
              <span className="text-lg">🔧</span>
            </div>
            <p className="text-gray-900 font-semibold text-sm">Manutenção</p>
            <p className="text-gray-400 text-xs mt-0.5">Solicitar ou acompanhar</p>
          </Link>
          <Link href="/app/notificacoes"
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[.97] transition-transform relative">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center mb-2">
              <Bell className="w-4 h-4 text-blue-600" />
              {notifs > 0 && (
                <span className="absolute top-3 right-3 bg-red-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {notifs}
                </span>
              )}
            </div>
            <p className="text-gray-900 font-semibold text-sm">Notificações</p>
            <p className="text-gray-400 text-xs mt-0.5">Alertas e avisos</p>
          </Link>
        </div>

        {/* Checklist pendente */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <ClipboardCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="text-gray-900 font-semibold text-sm">Checklist Diário</p>
              <p className="text-gray-400 text-xs mt-0.5">Realize a inspeção antes de iniciar a rota</p>
            </div>
            <Link href="/app/checklist"
              className="text-indigo-600 text-xs font-bold bg-indigo-50 px-3 py-1.5 rounded-lg">
              Iniciar
            </Link>
          </div>
        </div>
      </div>

      {/* D-08 — popup de solicitação de checklist pelo gestor */}
      {solicitacao && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-xl">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardCheck className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-center text-gray-900 font-bold text-lg mb-1">Checklist Solicitado</h2>
            <p className="text-center text-gray-500 text-sm mb-1">
              <span className="font-semibold text-gray-700">{solicitacao.solicitante_nome}</span> solicitou um checklist.
            </p>
            {solicitacao.placa && (
              <p className="text-center text-gray-400 text-xs mb-4">Veículo: {solicitacao.placa}</p>
            )}
            <div className="flex flex-col gap-2 mt-4">
              <Link
                href="/app/checklist"
                onClick={() => setSolicitacao(null)}
                className="text-white font-bold rounded-2xl py-3 px-4 flex items-center gap-2 justify-center text-sm active:scale-[.97] transition-transform"
                style={{ background: 'linear-gradient(135deg,#4B3FE4,#7C3AED)' }}
              >
                <PlayCircle className="w-5 h-5" />
                Realizar Agora
              </Link>
              <button
                onClick={() => setSolicitacao(null)}
                className="text-gray-500 font-semibold rounded-2xl py-3 px-4 text-sm bg-gray-100 active:scale-[.97] transition-transform"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav notifCount={notifs} />
    </div>
  )
}
