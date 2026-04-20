"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  ChevronLeft, Wrench, Plus, X, Clock, CheckCircle2,
  AlertTriangle, FileText, Loader2, Car, Bell,
} from 'lucide-react'
import BottomNav from '../components/BottomNav'

type StatusManutencao =
  | 'Aguardando Atendimento'
  | 'Aguardando Manutenção'
  | 'Em Manutenção'
  | 'Concluída'
  | 'Recusada'
  | 'Cancelada'

type Urgencia = 'muito_alta' | 'alta' | 'media' | 'baixa'
type Motivo   = 'Revisão' | 'Corretiva' | 'Preventiva' | 'Manutenção Sinistro' | 'Emergência'

interface Manutencao {
  id: string; codigo?: string; data_abertura: string
  motivo: string; urgencia: Urgencia; descricao: string
  km: number; status: StatusManutencao; observacao_recusa?: string
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  'Aguardando Atendimento': { label: 'Aguardando Atendimento', cls: 'bg-yellow-100 text-yellow-700' },
  'Aguardando Manutenção':  { label: 'Aguardando Manutenção',  cls: 'bg-blue-100 text-blue-700'    },
  'Em Manutenção':          { label: 'Em Manutenção',          cls: 'bg-orange-100 text-orange-700' },
  'Concluída':              { label: 'Concluída',              cls: 'bg-green-100 text-green-700'  },
  'Recusada':               { label: 'Recusada',               cls: 'bg-red-100 text-red-700'      },
  'Cancelada':              { label: 'Cancelada',              cls: 'bg-gray-100 text-gray-500'    },
}

const URGENCIA_CONFIG: Record<Urgencia, { label: string; cls: string }> = {
  muito_alta: { label: 'Muito Alta', cls: 'bg-red-100 text-red-700'      },
  alta:       { label: 'Alta',       cls: 'bg-orange-100 text-orange-700' },
  media:      { label: 'Média',      cls: 'bg-yellow-100 text-yellow-700' },
  baixa:      { label: 'Baixa',      cls: 'bg-gray-100 text-gray-500'    },
}

const MOTIVOS: Motivo[] = ['Revisão', 'Corretiva', 'Preventiva', 'Manutenção Sinistro', 'Emergência']
const URGENCIAS: { value: Urgencia; label: string }[] = [
  { value: 'muito_alta', label: 'Muito Alta' },
  { value: 'alta',       label: 'Alta'       },
  { value: 'media',      label: 'Média'      },
  { value: 'baixa',      label: 'Baixa'      },
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ─── Modal Nova Solicitação ──────────────────────────────────────────────────

function NovaManutencaoModal({
  kmAnterior, veiculoId, onClose, onSuccess,
}: { kmAnterior: number; veiculoId: string; onClose: () => void; onSuccess: () => void }) {
  const [km,        setKm]        = useState('')
  const [motivo,    setMotivo]    = useState<Motivo | ''>('')
  const [urgencia,  setUrgencia]  = useState<Urgencia | ''>('')
  const [descricao, setDescricao] = useState('')
  const [erros,     setErros]     = useState<Record<string, string>>({})
  const [enviando,  setEnviando]  = useState(false)
  const [sucesso,   setSucesso]   = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    const e2: Record<string, string> = {}
    const kmN = parseInt(km)
    if (!km || isNaN(kmN))      e2.km = 'Informe o KM atual.'
    else if (kmN < kmAnterior)  e2.km = `KM deve ser ≥ ${kmAnterior.toLocaleString('pt-BR')}`
    if (!motivo)                 e2.motivo = 'Selecione o motivo.'
    if (!urgencia)               e2.urgencia = 'Selecione a urgência.'
    if (!descricao.trim())       e2.descricao = 'Descrição obrigatória.'
    if (Object.keys(e2).length) { setErros(e2); return }

    setEnviando(true)
    try {
      const fd = new FormData()
      fd.append('veiculo_id', veiculoId)
      fd.append('km', km)
      fd.append('motivo', motivo)
      fd.append('urgencia', urgencia)
      fd.append('descricao', descricao)
      const res = await fetch('/api/app/manutencao', { method: 'POST', body: fd })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setErros({ global: j.message ?? 'Erro ao enviar.' })
        return
      }
      setSucesso(true)
      setTimeout(onSuccess, 1500)
    } catch {
      setErros({ global: 'Falha de conexão. Tente novamente.' })
    } finally { setEnviando(false) }
  }

  const inp = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Solicitar Manutenção</h3>
          <button onClick={onClose} className="p-2 rounded-xl bg-gray-100"><X className="w-4 h-4 text-gray-600" /></button>
        </div>

        {sucesso ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-gray-900 font-semibold text-lg">Solicitação enviada!</p>
            <p className="text-gray-400 text-sm mt-1">Aguarde a análise do gestor.</p>
          </div>
        ) : (
          <form onSubmit={enviar} className="flex-1 overflow-y-auto p-5 space-y-4">
            {erros.global && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm flex gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {erros.global}
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                KM Atual {kmAnterior > 0 && <span className="normal-case text-gray-300">(mín. {kmAnterior.toLocaleString('pt-BR')})</span>}
              </label>
              <input type="number" min={kmAnterior} className={inp} placeholder="Ex: 125000"
                value={km} onChange={e => { setKm(e.target.value); setErros(p => ({ ...p, km: '' })) }} />
              {erros.km && <p className="text-red-500 text-xs mt-1">{erros.km}</p>}
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Motivo</label>
              <select className={inp} value={motivo}
                onChange={e => { setMotivo(e.target.value as Motivo); setErros(p => ({ ...p, motivo: '' })) }}>
                <option value="" disabled>Selecione...</option>
                {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {erros.motivo && <p className="text-red-500 text-xs mt-1">{erros.motivo}</p>}
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Urgência</label>
              <select className={inp} value={urgencia}
                onChange={e => { setUrgencia(e.target.value as Urgencia); setErros(p => ({ ...p, urgencia: '' })) }}>
                <option value="" disabled>Selecione...</option>
                {URGENCIAS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
              {erros.urgencia && <p className="text-red-500 text-xs mt-1">{erros.urgencia}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Descrição do problema</label>
                <span className="text-[10px] text-gray-300">{descricao.length}/2000</span>
              </div>
              <textarea rows={4} className={`${inp} resize-none`} placeholder="Descreva o problema com detalhes..."
                value={descricao} onChange={e => { setDescricao(e.target.value.slice(0, 2000)); setErros(p => ({ ...p, descricao: '' })) }} />
              {erros.descricao && <p className="text-red-500 text-xs mt-1">{erros.descricao}</p>}
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm">
                Cancelar
              </button>
              <button type="submit" disabled={enviando}
                className="flex-1 py-3.5 rounded-2xl text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#4B3FE4,#7C3AED)' }}>
                {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
                {enviando ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Modal Detalhe ───────────────────────────────────────────────────────────

function DetalheModal({ item, onClose }: { item: Manutencao; onClose: () => void }) {
  const badge = STATUS_CONFIG[item.status] ?? { label: item.status, cls: 'bg-gray-100 text-gray-600' }
  const urg   = URGENCIA_CONFIG[item.urgencia] ?? { label: item.urgencia, cls: 'bg-gray-100 text-gray-500' }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 font-mono">{item.codigo ?? item.id}</p>
            <h3 className="text-lg font-bold text-gray-900 mt-0.5">{item.motivo}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-gray-100"><X className="w-4 h-4 text-gray-600" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${urg.cls}`}>{urg.label}</span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {[
              { label: 'Abertura', value: fmtDate(item.data_abertura) },
              { label: 'KM',       value: `${item.km?.toLocaleString('pt-BR')} km`  },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between px-4 py-3">
                <span className="text-gray-500 text-sm">{row.label}</span>
                <span className="text-gray-900 font-semibold text-sm">{row.value}</span>
              </div>
            ))}
          </div>

          {item.descricao && (
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Descrição</p>
              <p className="text-gray-700 text-sm leading-relaxed">{item.descricao}</p>
            </div>
          )}

          {item.observacao_recusa && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 text-xs font-semibold mb-1">Motivo da Recusa</p>
                <p className="text-red-600 text-sm">{item.observacao_recusa}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ManutencaoPage() {
  const [veiculoId,   setVeiculoId]   = useState<string | null>(null)
  const [kmAnterior,  setKmAnterior]  = useState(0)
  const [temAberta,   setTemAberta]   = useState(false)
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([])
  const [loading,     setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore,     setHasMore]     = useState(true)
  const [page,        setPage]        = useState(1)
  const [showNova,    setShowNova]    = useState(false)
  const [detalhe,     setDetalhe]     = useState<Manutencao | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadPerfil() {
      try {
        const res  = await fetch('/api/auth/profile')
        const json = await res.json()
        const profile = json.profile ?? json
        if (profile.veiculo_id) {
          setVeiculoId(profile.veiculo_id)
          const vRes  = await fetch('/api/app/veiculo')
          const vJson = await vRes.json()
          if (vJson.veiculo?.km_atual) setKmAnterior(vJson.veiculo.km_atual)
        }
      } catch { /* offline */ }
    }
    loadPerfil()
  }, [])

  const fetchManutencoes = useCallback(async (pg: number, replace = false) => {
    try {
      const res  = await fetch(`/api/app/manutencao?page=${pg}&limit=20`)
      const json = await res.json()
      const lista: Manutencao[] = json.manutencoes ?? []
      setManutencoes(prev => replace ? lista : [...prev, ...lista])
      setHasMore(lista.length === 20)
      if (replace) {
        const abertas = ['Aguardando Atendimento', 'Aguardando Manutenção', 'Em Manutenção']
        setTemAberta(lista.some(m => abertas.includes(m.status)))
      }
    } catch { /* offline */ } finally { setLoading(false); setLoadingMore(false) }
  }, [])

  useEffect(() => { setLoading(true); fetchManutencoes(1, true) }, [fetchManutencoes])

  useEffect(() => {
    if (!sentinelRef.current) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && hasMore && !loadingMore && !loading) {
        setLoadingMore(true)
        const next = page + 1; setPage(next)
        fetchManutencoes(next, false)
      }
    }, { threshold: 0.1 })
    obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [hasMore, loadingMore, loading, page, fetchManutencoes])

  function handleNovaSuccess() {
    setShowNova(false); setLoading(true); setPage(1); setManutencoes([])
    fetchManutencoes(1, true)
  }

  const btnDisabled = !veiculoId || temAberta

  // KPIs
  const pendentes   = manutencoes.filter(m => m.status === 'Aguardando Atendimento').length
  const emAndamento = manutencoes.filter(m => ['Aguardando Manutenção', 'Em Manutenção'].includes(m.status)).length
  const concluidas  = manutencoes.filter(m => m.status === 'Concluída').length

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F6FB] pb-20">

      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg,#4B3FE4,#7C3AED)' }}>
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">FleetFlow</span>
          </div>
          <Bell className="w-5 h-5 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Manutenções</h1>
        <p className="text-gray-500 text-sm mt-0.5">Solicite e acompanhe manutenções do seu veículo.</p>
      </div>

      <div className="px-5 pt-4 space-y-4">

        {/* KPIs */}
        {!loading && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Pendentes',    value: pendentes,   cls: 'text-yellow-600' },
              { label: 'Em Andamento', value: emAndamento, cls: 'text-blue-600'   },
              { label: 'Concluídas',   value: concluidas,  cls: 'text-green-600'  },
            ].map(k => (
              <div key={k.label} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
                <p className={`text-2xl font-bold ${k.cls}`}>{k.value}</p>
                <p className="text-gray-400 text-[10px] font-medium mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Botão solicitar */}
        <button
          onClick={() => !btnDisabled && setShowNova(true)}
          disabled={btnDisabled}
          className="w-full text-white font-bold rounded-2xl py-4 text-sm disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg,#4B3FE4,#7C3AED)' }}>
          <Plus className="w-5 h-5" />
          {!veiculoId ? 'Nenhum veículo vinculado' : temAberta ? 'Já existe uma manutenção em aberto' : 'Solicitar Manutenção'}
        </button>

        {/* Lista */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Histórico</p>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-gray-100" />)}
            </div>
          ) : manutencoes.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
              <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhuma manutenção registrada</p>
              <p className="text-gray-400 text-xs mt-1">Use o botão acima para solicitar.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {manutencoes.map(m => {
                const badge = STATUS_CONFIG[m.status] ?? { label: m.status, cls: 'bg-gray-100 text-gray-600' }
                const isAberta = ['Aguardando Atendimento', 'Aguardando Manutenção', 'Em Manutenção'].includes(m.status)
                return (
                  <button key={m.id} onClick={() => setDetalhe(m)}
                    className={`w-full bg-white rounded-2xl px-5 py-4 shadow-sm border text-left active:scale-[.98] transition-transform flex items-center justify-between ${
                      isAberta ? 'border-l-4 border-l-indigo-400 border-gray-100' : 'border-gray-100'
                    }`}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <p className="text-gray-900 font-semibold text-sm">{m.motivo}</p>
                      </div>
                      <p className="text-gray-400 text-xs">{fmtDate(m.data_abertura)}{m.km ? ` · ${m.km.toLocaleString('pt-BR')} km` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
                      {isAberta && <Clock className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                  </button>
                )
              })}
              <div ref={sentinelRef} className="h-4" />
              {loadingMore && (
                <div className="flex justify-center py-3">
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                </div>
              )}
              {!hasMore && manutencoes.length > 0 && (
                <p className="text-gray-400 text-xs text-center py-3">Todas as manutenções carregadas</p>
              )}
            </div>
          )}
        </div>
      </div>

      <BottomNav />

      {showNova && veiculoId && (
        <NovaManutencaoModal
          kmAnterior={kmAnterior}
          veiculoId={veiculoId}
          onClose={() => setShowNova(false)}
          onSuccess={handleNovaSuccess}
        />
      )}

      {detalhe && <DetalheModal item={detalhe} onClose={() => setDetalhe(null)} />}
    </div>
  )
}
