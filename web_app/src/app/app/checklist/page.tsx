"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  ChevronLeft, LogOut, ClipboardCheck, Plus, FileText,
  AlertTriangle, CheckCircle, Camera, Trash2, X, Loader2,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import BottomNav from '../components/BottomNav'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChecklistItem {
  id: string
  data_hora: string
  tipo: 'pre' | 'pos'
  status: 'aprovado' | 'com_pendencias' | 'validado'
}

interface Ativo {
  placa: string
  chassi: string
  modelo: string
  km_atual: number
}

interface Profile {
  nome: string
  veiculo_id?: string
  solicitacao_pendente?: {
    placa: string
    solicitante: string
    data: string
  } | null
}

interface SelectOpcao { value: string; label: string }

interface Avaria {
  descricao: string
  tipo: string
  gravidade: string
  foto: File | null
  fotoPreview: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCPF(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

function validarCPF(cpf: string) {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += +d[i] * (10 - i)
  let r = (sum * 10) % 11; if (r === 10 || r === 11) r = 0
  if (r !== +d[9]) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += +d[i] * (11 - i)
  r = (sum * 10) % 11; if (r === 10 || r === 11) r = 0
  return r === +d[10]
}

const TIPO_LABEL: Record<string, string> = { pre: 'Pré-operação', pos: 'Pós-operação' }
const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  aprovado:       { label: 'Aprovado',        cls: 'bg-green-500' },
  com_pendencias: { label: 'Com Pendências',  cls: 'bg-yellow-500' },
  validado:       { label: 'Validado',        cls: 'bg-emerald-700' },
}

const INSPECAO_ITENS = [
  'Pneus',
  'Óleo',
  'Arrefecimento',
  'Lâmpadas',
  'Estepe / triângulo / macaco',
  'Cartão combustível',
]

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProgressBar({ etapa, total = 6 }: { etapa: number; total?: number }) {
  return (
    <div className="w-full bg-slate-700 rounded-full h-1.5 mx-5" style={{ maxWidth: 'calc(100% - 2.5rem)' }}>
      <div
        className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${(etapa / total) * 100}%` }}
      />
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-4 w-24 bg-slate-700 rounded" />
        <div className="h-4 w-20 bg-slate-700 rounded" />
      </div>
      <div className="h-3 w-32 bg-slate-700 rounded mb-2" />
      <div className="h-3 w-16 bg-slate-700 rounded" />
    </div>
  )
}

// ─── Assinatura Canvas ────────────────────────────────────────────────────────

function SignatureCanvas({ onChange }: { onChange: (data: string) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e, canvas)
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y)
    drawing.current = true
  }

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!drawing.current) return
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e, canvas)
    ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.lineCap = 'round'
    ctx.lineTo(pos.x, pos.y); ctx.stroke()
    onChange(canvas.toDataURL())
  }

  const stop = () => { drawing.current = false }

  const clear = () => {
    const canvas = ref.current; if (!canvas) return
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    onChange('')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-xs uppercase tracking-widest">Assinatura</span>
        <button type="button" onClick={clear} className="text-xs text-red-400 flex items-center gap-1">
          <Trash2 className="w-3 h-3" /> Limpar
        </button>
      </div>
      <canvas
        ref={ref}
        width={340}
        height={140}
        className="w-full bg-slate-800 border border-slate-600 rounded-xl touch-none"
        onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop}
        onTouchStart={start} onTouchMove={move} onTouchEnd={stop}
      />
      <p className="text-slate-500 text-[11px] mt-1 text-center">Assine com o dedo ou mouse</p>
    </div>
  )
}

// ─── Modal Genérico ───────────────────────────────────────────────────────────

function Modal({ onClose, children }: { onClose?: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md relative">
        {onClose && (
          <button onClick={onClose} className="absolute top-3 right-3 p-1 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        )}
        {children}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChecklistPage() {
  // ── List state
  const [profile, setProfile]           = useState<Profile | null>(null)
  const [ativo, setAtivo]               = useState<Ativo | null>(null)
  const [historico, setHistorico]       = useState<ChecklistItem[]>([])
  const [loadingList, setLoadingList]   = useState(true)
  const [loadingMore, setLoadingMore]   = useState(false)
  const [hasMore, setHasMore]           = useState(true)
  const [page, setPage]                 = useState(1)

  // ── Modals / flow state
  const [showSolicitacao, setShowSolicitacao] = useState(false)
  const [showAbandon, setShowAbandon]         = useState(false)
  const [emFluxo, setEmFluxo]                 = useState(false)
  const [etapa, setEtapa]                     = useState(1)
  const [enviando, setEnviando]               = useState(false)
  const [checklistCriado, setChecklistCriado] = useState<string | null>(null)

  // ── Step 2
  const [tipoChecklist, setTipoChecklist] = useState<'pre' | 'pos'>('pre')
  const [unidade, setUnidade]             = useState('')
  const [setor, setSetor]                 = useState('')
  const [area, setArea]                   = useState('')
  const [opcoesUnidade, setOpcoesUnidade] = useState<SelectOpcao[]>([])
  const [opcoesSetor, setOpcoesSetor]     = useState<SelectOpcao[]>([])
  const [opcoesArea, setOpcoesArea]       = useState<SelectOpcao[]>([])

  // ── Step 3
  const [kmAtual, setKmAtual]       = useState('')
  const [kmErro, setKmErro]         = useState('')
  const [inspecao, setInspecao]     = useState<Record<string, boolean>>(
    Object.fromEntries(INSPECAO_ITENS.map(k => [k, true]))
  )
  const [observacao, setObservacao] = useState('')

  // ── Step 4
  const [fotoFrente, setFotoFrente]     = useState<File | null>(null)
  const [fotoFrentePreview, setFotoFrentePreview] = useState('')
  const [fotoTras, setFotoTras]         = useState<File | null>(null)
  const [fotoTrasPreview, setFotoTrasPreview]     = useState('')
  const [fotosExtra, setFotosExtra]     = useState<{ file: File; preview: string }[]>([])

  // ── Step 5
  const [showAvariaPergunta, setShowAvariaPergunta] = useState(false)
  const [temAvaria, setTemAvaria]                   = useState<boolean | null>(null)
  const [avarias, setAvarias]                       = useState<Avaria[]>([])

  // ── Step 6
  const [assinatura, setAssinatura] = useState('')
  const [cpf, setCpf]               = useState('')
  const [cpfErro, setCpfErro]       = useState('')
  const [emailEnvio, setEmailEnvio] = useState('')

  // ─── Load profile + list ─────────────────────────────────────────────────

  const loadList = useCallback(async (p = 1, replace = false) => {
    try {
      const res  = await fetch(`/api/app/checklist?page=${p}&limit=20`)
      const json = await res.json()
      const items: ChecklistItem[] = json.data ?? []
      setHistorico(prev => replace ? items : [...prev, ...items])
      setHasMore(items.length === 20)
      setPage(p)
    } catch { /* offline */ }
  }, [])

  useEffect(() => {
    async function init() {
      try {
        const res  = await fetch('/api/auth/profile')
        const json = await res.json()
        const p: Profile = json.profile ?? json
        setProfile(p)
        setEmailEnvio(json.profile?.email ?? json.email ?? '')

        if (p.solicitacao_pendente) setShowSolicitacao(true)

        if (p.veiculo_id) {
          const vRes  = await fetch(`/api/admin/veiculos?id=${p.veiculo_id}`)
          const vJson = await vRes.json()
          if (vJson.veiculo) setAtivo(vJson.veiculo)
        }
      } catch { /* offline */ }

      await loadList(1, true)
      setLoadingList(false)
    }
    init()
  }, [loadList])

  // Infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!sentinelRef.current) return
    const obs = new IntersectionObserver(async ([entry]) => {
      if (entry.isIntersecting && hasMore && !loadingMore) {
        setLoadingMore(true)
        await loadList(page + 1)
        setLoadingMore(false)
      }
    }, { threshold: 0.5 })
    obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [hasMore, loadingMore, page, loadList])

  // ─── Load opcoes for step 2 ───────────────────────────────────────────────

  useEffect(() => {
    if (!emFluxo || etapa !== 2) return
    const load = async (tipo: string, setter: (v: SelectOpcao[]) => void) => {
      try {
        const res  = await fetch(`/api/app/config-opcoes?tipo=${tipo}`)
        const json = await res.json()
        setter(json.opcoes ?? [])
      } catch { setter([]) }
    }
    load('checklist_unidade', setOpcoesUnidade)
    load('checklist_setor',   setOpcoesSetor)
    load('checklist_area',    setOpcoesArea)
  }, [emFluxo, etapa])

  // ─── Handlers ─────────────────────────────────────────────────────────────

  function logout() {
    if (!confirm('Deseja sair do FleetFlow?')) return
    fetch('/api/auth/login', { method: 'DELETE' })
    window.location.href = '/app/login'
  }

  function iniciarChecklist() {
    if (!ativo) return
    setEtapa(1)
    setEmFluxo(true)
    setChecklistCriado(null)
    resetFlow()
  }

  function resetFlow() {
    setTipoChecklist('pre'); setUnidade(''); setSetor(''); setArea('')
    setKmAtual(''); setKmErro('')
    setInspecao(Object.fromEntries(INSPECAO_ITENS.map(k => [k, true])))
    setObservacao('')
    setFotoFrente(null); setFotoFrentePreview(''); setFotoTras(null); setFotoTrasPreview(''); setFotosExtra([])
    setTemAvaria(null); setAvarias([])
    setAssinatura(''); setCpf(''); setCpfErro(''); setShowAvariaPergunta(false)
  }

  function tryVoltar() {
    if (etapa === 1) { setShowAbandon(true); return }
    setEtapa(e => e - 1)
  }

  function avancar() {
    if (etapa === 3) {
      const kmA = ativo?.km_atual ?? 0
      if (!kmAtual || +kmAtual < kmA) { setKmErro(`KM atual deve ser ≥ ${kmA}`); return }
      setKmErro('')
    }
    if (etapa === 4) {
      if (!fotoFrente || !fotoTras) return
    }
    if (etapa === 5) {
      if (temAvaria === null) { setShowAvariaPergunta(true); return }
    }
    if (etapa < 6) setEtapa(e => e + 1)
  }

  function fileToPreview(file: File, setter: (s: string) => void) {
    const r = new FileReader()
    r.onload = e => setter(e.target?.result as string)
    r.readAsDataURL(file)
  }

  function adicionarAvaria() {
    setAvarias(prev => [...prev, { descricao: '', tipo: '', gravidade: '', foto: null, fotoPreview: '' }])
  }

  function atualizarAvaria(idx: number, field: keyof Avaria, value: string | File | null) {
    setAvarias(prev => {
      const next = [...prev]
      if (field === 'foto' && value instanceof File) {
        fileToPreview(value, preview => {
          setAvarias(p => { const n = [...p]; n[idx] = { ...n[idx], foto: value, fotoPreview: preview }; return n })
        })
        next[idx] = { ...next[idx], foto: value }
      } else {
        next[idx] = { ...next[idx], [field]: value }
      }
      return next
    })
  }

  async function enviarChecklist() {
    if (!validarCPF(cpf)) { setCpfErro('CPF inválido'); return }
    setCpfErro('')
    if (!assinatura) return
    setEnviando(true)
    try {
      const form = new FormData()
      form.append('tipo',        tipoChecklist)
      form.append('unidade',     unidade)
      form.append('setor',       setor)
      form.append('area',        area)
      form.append('km_atual',    kmAtual)
      form.append('inspecao',    JSON.stringify(inspecao))
      form.append('observacao',  observacao)
      form.append('cpf',         cpf)
      form.append('email_envio', emailEnvio)
      form.append('assinatura',  assinatura)
      if (fotoFrente) form.append('foto_frente', fotoFrente)
      if (fotoTras)   form.append('foto_tras',   fotoTras)
      fotosExtra.forEach((f, i) => form.append(`foto_extra_${i}`, f.file))
      form.append('tem_avaria', String(!!temAvaria))
      avarias.forEach((a, i) => {
        form.append(`avaria_${i}_descricao`, a.descricao)
        form.append(`avaria_${i}_tipo`,      a.tipo)
        form.append(`avaria_${i}_gravidade`, a.gravidade)
        if (a.foto) form.append(`avaria_${i}_foto`, a.foto)
      })

      const res  = await fetch('/api/app/checklist', { method: 'POST', body: form })
      const json = await res.json()
      setChecklistCriado(json.id ?? json.checklist_id ?? 'CHK-NOVO')
      setEtapa(7) // tela de confirmação
      await loadList(1, true)
    } catch { alert('Erro ao enviar. Tente novamente.') }
    finally { setEnviando(false) }
  }

  // ─── Render fluxo ─────────────────────────────────────────────────────────

  if (emFluxo) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-900 max-w-md mx-auto">

        {/* Abandon modal */}
        {showAbandon && (
          <Modal>
            <div className="p-6">
              <AlertTriangle className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-white font-bold text-lg text-center mb-2">Abandonar Checklist?</h3>
              <p className="text-slate-400 text-sm text-center mb-6">As informações preenchidas serão perdidas.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowAbandon(false)}
                  className="flex-1 bg-slate-700 text-white rounded-xl py-3 font-semibold text-sm">
                  Continuar
                </button>
                <button onClick={() => { setShowAbandon(false); setEmFluxo(false) }}
                  className="flex-1 bg-red-600 text-white rounded-xl py-3 font-semibold text-sm">
                  Abandonar
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Pergunta avaria modal */}
        {showAvariaPergunta && (
          <Modal>
            <div className="p-6 text-center">
              <AlertTriangle className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-white font-bold text-lg mb-2">O ativo tem avaria?</h3>
              <p className="text-slate-400 text-sm mb-6">Registre qualquer dano ou problema encontrado no veículo.</p>
              <div className="flex gap-3">
                <button onClick={() => { setTemAvaria(false); setShowAvariaPergunta(false); setEtapa(6) }}
                  className="flex-1 bg-green-600 text-white rounded-xl py-3.5 font-semibold">
                  NÃO
                </button>
                <button onClick={() => { setTemAvaria(true); setShowAvariaPergunta(false); if (avarias.length === 0) adicionarAvaria() }}
                  className="flex-1 bg-red-600 text-white rounded-xl py-3.5 font-semibold">
                  SIM
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Tela de confirmação (etapa 7) */}
        {etapa === 7 && (
          <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
            <CheckCircle className="w-20 h-20 text-green-400 mb-4" />
            <h2 className="text-white text-2xl font-bold mb-2">Checklist Enviado!</h2>
            <p className="text-slate-400 text-sm mb-2">Seu checklist foi registrado com sucesso.</p>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 mb-6">
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Protocolo</p>
              <p className="text-white text-xl font-bold tracking-widest">{checklistCriado}</p>
            </div>
            <button onClick={() => { setEmFluxo(false); setEtapa(1) }}
              className="bg-blue-600 text-white rounded-xl py-3.5 px-8 font-semibold w-full">
              Voltar ao Histórico
            </button>
          </div>
        )}

        {etapa < 7 && (
          <>
            {/* Header fluxo */}
            <header className="flex items-center gap-3 px-5 pt-12 pb-3">
              <button onClick={tryVoltar} className="p-2 -ml-2">
                <ChevronLeft className="w-6 h-6 text-slate-300" />
              </button>
              <div className="flex-1">
                <p className="text-white font-bold text-base">
                  {etapa === 1 && 'Identificação do Ativo'}
                  {etapa === 2 && 'Dados do Motorista'}
                  {etapa === 3 && 'Inspeção Técnica'}
                  {etapa === 4 && 'Evidência Fotográfica'}
                  {etapa === 5 && 'Registro de Avaria'}
                  {etapa === 6 && 'Assinatura e Finalização'}
                </p>
                <p className="text-slate-500 text-xs">Etapa {etapa} de 6</p>
              </div>
            </header>

            {/* Progress */}
            <div className="px-5 mb-5">
              <ProgressBar etapa={etapa} />
            </div>

            {/* Steps content */}
            <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">

              {/* ── Etapa 1 ── */}
              {etapa === 1 && (
                <>
                  <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Ativo Vinculado</p>
                  {[
                    { label: 'Placa',   value: ativo?.placa   ?? '—' },
                    { label: 'Chassi',  value: ativo?.chassi  ?? '—' },
                    { label: 'Modelo',  value: ativo?.modelo  ?? '—' },
                  ].map(f => (
                    <div key={f.label} className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                      <p className="text-slate-500 text-xs mb-1">{f.label}</p>
                      <p className="text-white font-semibold text-sm">{f.value}</p>
                    </div>
                  ))}
                  <button onClick={() => setEtapa(2)}
                    className="w-full bg-blue-600 text-white rounded-xl py-3.5 font-semibold mt-2">
                    Confirmar e Avançar
                  </button>
                </>
              )}

              {/* ── Etapa 2 ── */}
              {etapa === 2 && (
                <>
                  <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                    <p className="text-slate-500 text-xs mb-1">Motorista</p>
                    <p className="text-white font-semibold text-sm">{profile?.nome ?? '—'}</p>
                  </div>

                  <div>
                    <label className="text-slate-400 text-xs uppercase tracking-widest block mb-1.5">Tipo do Checklist</label>
                    <select value={tipoChecklist} onChange={e => setTipoChecklist(e.target.value as 'pre' | 'pos')}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm">
                      <option value="pre">Pré-operação</option>
                      <option value="pos">Pós-operação</option>
                    </select>
                  </div>

                  {[
                    { label: 'Unidade', value: unidade, onChange: setUnidade, opcoes: opcoesUnidade },
                    { label: 'Setor',   value: setor,   onChange: setSetor,   opcoes: opcoesSetor   },
                    { label: 'Área',    value: area,    onChange: setArea,    opcoes: opcoesArea    },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="text-slate-400 text-xs uppercase tracking-widest block mb-1.5">{f.label}</label>
                      <select value={f.value} onChange={e => f.onChange(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm">
                        <option value="">Selecione...</option>
                        {f.opcoes.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  ))}
                </>
              )}

              {/* ── Etapa 3 ── */}
              {etapa === 3 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                      <p className="text-slate-500 text-xs mb-1">KM Anterior</p>
                      <p className="text-white font-semibold">{ativo?.km_atual?.toLocaleString('pt-BR') ?? '—'}</p>
                    </div>
                    <div>
                      <label className="text-slate-400 text-xs uppercase tracking-widest block mb-1.5">KM Atual</label>
                      <input
                        type="number"
                        value={kmAtual}
                        onChange={e => { setKmAtual(e.target.value); setKmErro('') }}
                        placeholder="Ex: 50000"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm"
                      />
                      {kmErro && <p className="text-red-400 text-xs mt-1">{kmErro}</p>}
                    </div>
                  </div>

                  <p className="text-slate-400 text-xs uppercase tracking-widest mt-2">Itens de Inspeção</p>
                  {INSPECAO_ITENS.map(item => (
                    <div key={item} className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex items-center justify-between">
                      <span className="text-white text-sm">{item}</span>
                      <button
                        onClick={() => setInspecao(prev => ({ ...prev, [item]: !prev[item] }))}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                          inspecao[item] ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        }`}
                      >
                        {inspecao[item] ? 'Conforme' : 'Não Conforme'}
                      </button>
                    </div>
                  ))}

                  <div>
                    <label className="text-slate-400 text-xs uppercase tracking-widest block mb-1.5">
                      Observações <span className="normal-case text-slate-500">(max 2000 chars)</span>
                    </label>
                    <textarea
                      value={observacao}
                      onChange={e => setObservacao(e.target.value.slice(0, 2000))}
                      rows={4}
                      placeholder="Descreva observações relevantes..."
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm resize-none"
                    />
                    <p className="text-slate-600 text-xs text-right">{observacao.length}/2000</p>
                  </div>
                </>
              )}

              {/* ── Etapa 4 ── */}
              {etapa === 4 && (
                <>
                  <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Fotos Obrigatórias</p>
                  {[
                    { label: 'Foto Dianteira', preview: fotoFrentePreview, setter: (f: File) => { setFotoFrente(f); fileToPreview(f, setFotoFrentePreview) } },
                    { label: 'Foto Traseira',  preview: fotoTrasPreview,  setter: (f: File) => { setFotoTras(f);   fileToPreview(f, setFotoTrasPreview)   } },
                  ].map(slot => (
                    <label key={slot.label} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-4 cursor-pointer active:opacity-80">
                      <input type="file" accept="image/*" className="sr-only"
                        onChange={e => { const f = e.target.files?.[0]; if (f) slot.setter(f) }} />
                      {slot.preview ? (
                        <img src={slot.preview} alt={slot.label} className="w-16 h-16 rounded-xl object-cover border border-slate-600" />
                      ) : (
                        <div className="w-16 h-16 bg-slate-700 rounded-xl flex items-center justify-center border border-dashed border-slate-500">
                          <Camera className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-white text-sm font-semibold">{slot.label}</p>
                        <p className="text-slate-400 text-xs">{slot.preview ? 'Toque para alterar' : 'Toque para fotografar'}</p>
                        <span className="text-red-400 text-xs font-medium">Obrigatória</span>
                      </div>
                    </label>
                  ))}

                  {fotosExtra.length > 0 && (
                    <>
                      <p className="text-slate-400 text-xs uppercase tracking-widest">Fotos Adicionais</p>
                      {fotosExtra.map((fe, i) => (
                        <div key={i} className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-2xl p-3">
                          <img src={fe.preview} alt="" className="w-14 h-14 rounded-xl object-cover border border-slate-600" />
                          <p className="text-white text-sm flex-1">Foto extra {i + 1}</p>
                          <button onClick={() => setFotosExtra(prev => prev.filter((_, j) => j !== i))} className="text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </>
                  )}

                  <label className="flex items-center justify-center gap-2 border border-dashed border-slate-600 rounded-xl py-3 text-slate-400 text-sm cursor-pointer active:opacity-70">
                    <input type="file" accept="image/*" className="sr-only"
                      onChange={e => {
                        const f = e.target.files?.[0]; if (!f) return
                        fileToPreview(f, preview => setFotosExtra(prev => [...prev, { file: f, preview }]))
                      }} />
                    <Plus className="w-4 h-4" /> Adicionar Foto
                  </label>

                  {(!fotoFrente || !fotoTras) && (
                    <p className="text-red-400 text-xs text-center">Adicione as duas fotos obrigatórias para avançar.</p>
                  )}
                </>
              )}

              {/* ── Etapa 5 ── */}
              {etapa === 5 && (
                <>
                  {temAvaria === null && (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-14 h-14 text-yellow-400 mx-auto mb-4" />
                      <p className="text-white font-semibold mb-2">Verificação de Avaria</p>
                      <p className="text-slate-400 text-sm mb-6">Toque em "Avançar" para responder sobre avarias no ativo.</p>
                    </div>
                  )}

                  {temAvaria === false && (
                    <div className="bg-green-900/30 border border-green-700 rounded-2xl p-5 text-center">
                      <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                      <p className="text-green-300 font-semibold">Nenhuma avaria registrada</p>
                    </div>
                  )}

                  {temAvaria === true && (
                    <>
                      <p className="text-slate-400 text-xs uppercase tracking-widest">Avarias Registradas</p>
                      {avarias.map((av, i) => (
                        <div key={i} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-white font-semibold text-sm">Avaria {i + 1}</p>
                            <button onClick={() => setAvarias(prev => prev.filter((_, j) => j !== i))} className="text-red-400">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <textarea
                            value={av.descricao}
                            onChange={e => atualizarAvaria(i, 'descricao', e.target.value)}
                            rows={3}
                            placeholder="Descrição da avaria..."
                            className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm resize-none"
                          />
                          <select value={av.tipo} onChange={e => atualizarAvaria(i, 'tipo', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm">
                            <option value="">Tipo da avaria...</option>
                            <option value="mecanica">Mecânica</option>
                            <option value="carroceria">Carroceria</option>
                            <option value="eletrica">Elétrica</option>
                            <option value="pneu">Pneu</option>
                            <option value="outro">Outro</option>
                          </select>
                          <select value={av.gravidade} onChange={e => atualizarAvaria(i, 'gravidade', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm">
                            <option value="">Gravidade...</option>
                            <option value="leve">Leve</option>
                            <option value="moderada">Moderada</option>
                            <option value="grave">Grave</option>
                            <option value="critica">Crítica</option>
                          </select>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="file" accept="image/*" className="sr-only"
                              onChange={e => { const f = e.target.files?.[0]; if (f) atualizarAvaria(i, 'foto', f) }} />
                            {av.fotoPreview ? (
                              <img src={av.fotoPreview} alt="" className="w-14 h-14 rounded-xl object-cover border border-slate-600" />
                            ) : (
                              <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center border border-dashed border-slate-500">
                                <Camera className="w-5 h-5 text-slate-400" />
                              </div>
                            )}
                            <div>
                              <p className="text-white text-sm">Foto da avaria</p>
                              <p className="text-red-400 text-xs">Obrigatória</p>
                            </div>
                          </label>
                        </div>
                      ))}
                      <button onClick={adicionarAvaria}
                        className="flex items-center justify-center gap-2 w-full border border-dashed border-slate-600 rounded-xl py-3 text-slate-400 text-sm">
                        <Plus className="w-4 h-4" /> Adicionar Avaria
                      </button>
                    </>
                  )}
                </>
              )}

              {/* ── Etapa 6 ── */}
              {etapa === 6 && (
                <>
                  <SignatureCanvas onChange={setAssinatura} />

                  <div>
                    <label className="text-slate-400 text-xs uppercase tracking-widest block mb-1.5">CPF</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cpf}
                      onChange={e => { setCpf(formatCPF(e.target.value)); setCpfErro('') }}
                      placeholder="000.000.000-00"
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm"
                    />
                    {cpfErro && <p className="text-red-400 text-xs mt-1">{cpfErro}</p>}
                  </div>

                  <div>
                    <label className="text-slate-400 text-xs uppercase tracking-widest block mb-1.5">E-mail para envio do PDF</label>
                    <input
                      type="email"
                      value={emailEnvio}
                      onChange={e => setEmailEnvio(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm"
                    />
                  </div>

                  <button
                    onClick={enviarChecklist}
                    disabled={enviando || !assinatura || cpf.replace(/\D/g, '').length < 11}
                    className="w-full bg-blue-600 text-white rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {enviando && <Loader2 className="w-5 h-5 animate-spin" />}
                    {enviando ? 'Enviando...' : 'Enviar Checklist'}
                  </button>
                </>
              )}
            </div>

            {/* Rodapé de navegação */}
            {etapa > 1 && etapa < 7 && (
              <div className="flex gap-3 px-5 pb-6 pt-2">
                <button onClick={tryVoltar}
                  className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-1">
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                {etapa < 6 && (
                  <button
                    onClick={() => {
                      if (etapa === 5 && temAvaria === null) { setShowAvariaPergunta(true); return }
                      avancar()
                    }}
                    disabled={etapa === 4 && (!fotoFrente || !fotoTras)}
                    className="flex-1 bg-blue-600 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-1 disabled:opacity-50">
                    Avançar <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  // ─── Tela de lista ────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 max-w-md mx-auto">

      {/* Modal solicitação pendente */}
      {showSolicitacao && profile?.solicitacao_pendente && (
        <Modal>
          <div className="p-6">
            <AlertTriangle className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-white font-bold text-lg text-center mb-4">Solicitação Pendente</h3>
            <div className="space-y-3 mb-6">
              {[
                { label: 'Placa',       value: profile.solicitacao_pendente.placa       },
                { label: 'Solicitante', value: profile.solicitacao_pendente.solicitante },
                { label: 'Data',        value: profile.solicitacao_pendente.data        },
              ].map(f => (
                <div key={f.label} className="bg-slate-900 rounded-xl p-3 border border-slate-700">
                  <p className="text-slate-500 text-xs">{f.label}</p>
                  <p className="text-white font-semibold text-sm">{f.value}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setShowSolicitacao(false)}
              className="w-full bg-blue-600 text-white rounded-xl py-3.5 font-semibold">
              Entendido
            </button>
          </div>
        </Modal>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/app/home" className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-slate-300" />
          </Link>
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-widest">FleetFlow</p>
            <h1 className="text-white font-bold text-lg">Checklist Diário</h1>
          </div>
        </div>
        <button onClick={logout} className="p-2">
          <LogOut className="w-5 h-5 text-slate-400" />
        </button>
      </header>

      {/* Botão Iniciar */}
      <div className="px-5 mb-5">
        <div className="relative group">
          <button
            onClick={iniciarChecklist}
            disabled={!ativo}
            className="w-full bg-blue-600 text-white rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ClipboardCheck className="w-5 h-5" />
            Iniciar Checklist
          </button>
          {!ativo && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-slate-700 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                Nenhum ativo vinculado à sua conta
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-700" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Histórico */}
      <div className="px-5 flex-1">
        <p className="text-slate-500 text-xs uppercase tracking-widest mb-3">Histórico</p>

        {loadingList ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : historico.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardCheck className="w-14 h-14 text-slate-700 mb-4" />
            <p className="text-slate-400 font-medium mb-1">Nenhum checklist realizado.</p>
            <p className="text-slate-500 text-sm">Toque em Iniciar Checklist para começar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {historico.map(ck => {
              const badge = STATUS_BADGE[ck.status] ?? { label: ck.status, cls: 'bg-slate-600' }
              const dt    = new Date(ck.data_hora)
              const dataFmt = dt.toLocaleDateString('pt-BR')
              const horaFmt = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              return (
                <div key={ck.id} className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-white font-bold text-sm tracking-wide">{ck.id}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{dataFmt} às {horaFmt}</p>
                    </div>
                    <span className={`text-[10px] font-bold text-white px-2.5 py-1 rounded-full whitespace-nowrap ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs">{TIPO_LABEL[ck.tipo] ?? ck.tipo}</span>
                    <button className="flex items-center gap-1 text-blue-400 text-xs font-semibold">
                      <FileText className="w-3.5 h-3.5" /> Ver PDF
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Sentinel para infinite scroll */}
            <div ref={sentinelRef} className="h-4" />
            {loadingMore && (
              <div className="flex justify-center py-3">
                <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
              </div>
            )}
            {!hasMore && historico.length > 0 && (
              <p className="text-slate-600 text-xs text-center py-3">Todos os registros exibidos</p>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
